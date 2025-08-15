import type { FC } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import StatusIcon, { normalizeStatus } from './StatusIcon';
import { useState } from 'react';
import { KubernetesResource } from '@/types';

export interface HierarchyNode {
  id: string;
  name: string;
  kind: string;
  namespace?: string;
  status: string;
  children?: HierarchyNode[];
  metadata?: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    createdAt?: string;
  };
}

interface ResourceHierarchyProps {
  nodes: HierarchyNode[];
  onNodeSelect?: (node: HierarchyNode) => void;
  selectedNodeId?: string;
  maxDepth?: number;
  showNamespace?: boolean;
}

interface TreeNodeProps {
  node: HierarchyNode;
  depth: number;
  maxDepth: number;
  onNodeSelect?: (node: HierarchyNode) => void;
  selectedNodeId?: string;
  showNamespace: boolean;
}

const TreeNode: FC<TreeNodeProps> = ({
  node,
  depth,
  maxDepth,
  onNodeSelect,
  selectedNodeId,
  showNamespace
}) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0 || depth === 1);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const isMaxDepth = depth >= maxDepth;

  const handleToggle = () => {
    if (hasChildren && !isMaxDepth) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onNodeSelect?.(node);
  };

  const getKindIcon = (kind: string) => {
    // Return appropriate icon based on resource kind
    const kindLower = kind.toLowerCase();
    if (kindLower.includes('namespace')) return '🏢';
    if (kindLower.includes('deployment')) return '🚀';
    if (kindLower.includes('service')) return '🔗';
    if (kindLower.includes('pod')) return '📦';
    if (kindLower.includes('node')) return '🖥️';
    if (kindLower.includes('configmap')) return '⚙️';
    if (kindLower.includes('secret')) return '🔒';
    if (kindLower.includes('ingress')) return '🌐';
    if (kindLower.includes('persistentvolume')) return '💾';
    return '📄';
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer transition-colors ${
          isSelected ? 'bg-white/10' : 'hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Button */}
        <div className="w-4 flex justify-center mr-2">
          {hasChildren && !isMaxDepth ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
            </button>
          ) : null}
        </div>

        {/* Folder Icon for containers */}
        {hasChildren && (
          <div className="mr-2">
            {isExpanded ? (
              <FolderOpen size={12} className="text-gray-400" />
            ) : (
              <Folder size={12} className="text-gray-400" />
            )}
          </div>
        )}

        {/* Kind Icon */}
        <span className="mr-2 text-xs">{getKindIcon(node.kind)}</span>

        {/* Resource Info */}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <span className="font-mono text-sm truncate">{node.name}</span>
          
          {showNamespace && node.namespace && (
            <span className="text-xs text-gray-500 font-mono">
              {node.namespace}
            </span>
          )}
          
          <span className="text-xs text-gray-400 font-mono">
            {node.kind}
          </span>
          
          <div className="ml-auto flex items-center space-x-1">
            <StatusIcon status={normalizeStatus(node.status)} size={12} />
            {hasChildren && (
              <span className="text-xs text-gray-500">
                ({node.children?.length})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && !isMaxDepth && (
        <div>
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              onNodeSelect={onNodeSelect}
              selectedNodeId={selectedNodeId}
              showNamespace={showNamespace}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ResourceHierarchy: FC<ResourceHierarchyProps> = ({
  nodes,
  onNodeSelect,
  selectedNodeId,
  maxDepth = 4,
  showNamespace = true
}) => {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-sm font-mono">No resources found</div>
      </div>
    );
  }

  return (
    <div className="border border-white bg-black">
      <div className="border-b border-white/20 px-4 py-2">
        <h3 className="font-mono text-sm font-bold">RESOURCE HIERARCHY</h3>
        <div className="text-xs font-mono text-gray-500">
          {nodes.length} root resource{nodes.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            maxDepth={maxDepth}
            onNodeSelect={onNodeSelect}
            selectedNodeId={selectedNodeId}
            showNamespace={showNamespace}
          />
        ))}
      </div>
    </div>
  );
};

export default ResourceHierarchy;

// Utility function to build hierarchy from flat resource list
export const buildResourceHierarchy = (resources: KubernetesResource[]): HierarchyNode[] => {
  const nodeMap = new Map<string, HierarchyNode>();
  const rootNodes: HierarchyNode[] = [];

  // First pass: create all nodes
  resources.forEach((resource) => {
    const node: HierarchyNode = {
      id: resource.metadata?.uid || `${resource.metadata?.namespace || 'default'}-${resource.metadata?.name}`,
      name: resource.metadata?.name || 'Unknown',
      kind: resource.kind || 'Unknown',
      namespace: resource.metadata?.namespace,
      status: resource.status?.phase || resource.status?.conditions?.[0]?.type || 'Unknown',
      children: [],
      metadata: {
        labels: resource.metadata?.labels,
        annotations: resource.metadata?.annotations,
        createdAt: resource.metadata?.creationTimestamp
      }
    };
    nodeMap.set(node.id, node);
  });

  // Second pass: establish parent-child relationships
  resources.forEach((resource) => {
    const nodeId = resource.metadata?.uid || `${resource.metadata?.namespace || 'default'}-${resource.metadata?.name}`;
    const node = nodeMap.get(nodeId);
    
    if (!node) return;

    // Check for owner references to establish hierarchy
    const ownerRefs = resource.metadata?.ownerReferences || [];
    let hasParent = false;

    ownerRefs.forEach((ownerRef) => {
      const parentId = ownerRef.uid;
      const parent = nodeMap.get(parentId);
      
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
        hasParent = true;
      }
    });

    // If no parent found, it's a root node
    if (!hasParent) {
      rootNodes.push(node);
    }
  });

  // Sort nodes by kind and name
  const sortNodes = (nodes: HierarchyNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind.localeCompare(b.kind);
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(rootNodes);
  return rootNodes;
};