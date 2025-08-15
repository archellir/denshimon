import type { FC } from 'react';
import { useState, useEffect } from 'react';
import ResourceHierarchy, { type HierarchyNode, buildResourceHierarchy } from '@components/common/ResourceHierarchy';
import ManifestViewer, { generateSampleManifest } from '@components/common/ManifestViewer';
import ResourceActions, { handleResourceAction } from '@components/common/ResourceActions';
import SkeletonLoader from '@components/common/SkeletonLoader';
import { API_ENDPOINTS } from '@/constants';
import { MOCK_ENABLED } from '@/mocks';
import { KubernetesResource } from '@/types';

// Mock Kubernetes resources for demonstration
const generateMockResources = (): KubernetesResource[] => {
  const namespaces = ['production', 'staging', 'default'];
  const resources: KubernetesResource[] = [];

  namespaces.forEach((ns, nsIndex) => {
    // Namespace
    const namespaceId = `ns-${nsIndex}`;
    resources.push({
      kind: 'Namespace',
      metadata: {
        uid: namespaceId,
        name: ns,
        creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
      },
      status: {
        phase: 'Active'
      }
    });

    // Deployments in each namespace
    for (let i = 0; i < 2; i++) {
      const deploymentId = `deploy-${nsIndex}-${i}`;
      const deploymentName = `${ns === 'production' ? 'web-app' : 'test-app'}-${i + 1}`;
      
      resources.push({
        kind: 'Deployment',
        metadata: {
          uid: deploymentId,
          name: deploymentName,
          namespace: ns,
          ownerReferences: [
            {
              uid: namespaceId,
              kind: 'Namespace',
              name: ns
            }
          ],
          labels: {
            app: deploymentName,
            version: 'v1.0.0',
            tier: ns === 'production' ? 'production' : 'development'
          },
          creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        },
        status: {
          conditions: [
            {
              type: Math.random() > 0.8 ? 'Progressing' : 'Available'
            }
          ]
        }
      });

      // ReplicaSet for each Deployment
      const replicaSetId = `rs-${nsIndex}-${i}`;
      resources.push({
        kind: 'ReplicaSet',
        metadata: {
          uid: replicaSetId,
          name: `${deploymentName}-abc123`,
          namespace: ns,
          ownerReferences: [
            {
              uid: deploymentId,
              kind: 'Deployment',
              name: deploymentName
            }
          ],
          labels: {
            app: deploymentName
          },
          creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        },
        status: {
          conditions: [
            {
              type: 'Available'
            }
          ]
        }
      });

      // Pods for each ReplicaSet
      for (let j = 0; j < 3; j++) {
        const podId = `pod-${nsIndex}-${i}-${j}`;
        resources.push({
          kind: 'Pod',
          metadata: {
            uid: podId,
            name: `${deploymentName}-abc123-${j}xyz`,
            namespace: ns,
            ownerReferences: [
              {
                uid: replicaSetId,
                kind: 'ReplicaSet',
                name: `${deploymentName}-abc123`
              }
            ],
            labels: {
              app: deploymentName
            },
            creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
          },
          status: {
            phase: Math.random() > 0.9 ? 'Pending' : Math.random() > 0.95 ? 'Failed' : 'Running'
          }
        });
      }
    }

    // Services
    const serviceId = `svc-${nsIndex}`;
    resources.push({
      kind: 'Service',
      metadata: {
        uid: serviceId,
        name: `${ns}-service`,
        namespace: ns,
        ownerReferences: [
          {
            uid: namespaceId,
            kind: 'Namespace',
            name: ns
          }
        ],
        labels: {
          app: 'web-app'
        },
        creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString()
      },
      status: {
        conditions: [
          {
            type: 'Ready'
          }
        ]
      }
    });

    // ConfigMaps
    const configMapId = `cm-${nsIndex}`;
    resources.push({
      kind: 'ConfigMap',
      metadata: {
        uid: configMapId,
        name: `${ns}-config`,
        namespace: ns,
        ownerReferences: [
          {
            uid: namespaceId,
            kind: 'Namespace',
            name: ns
          }
        ],
        creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 21).toISOString()
      },
      status: {
        phase: 'Active'
      }
    });
  });

  return resources;
};

interface ResourceTreeProps {
  selectedNamespace?: string;
}

const ResourceTree: FC<ResourceTreeProps> = ({ selectedNamespace }) => {
  const [_resources, _setResources] = useState<any[]>([]);
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showManifest, setShowManifest] = useState(false);

  useEffect(() => {
    loadResources();
  }, [selectedNamespace]);

  const loadResources = async () => {
    setIsLoading(true);
    
    try {
      if (MOCK_ENABLED) {
        // Use mock data
        setTimeout(() => {
          let mockResources = generateMockResources();
          
          // Filter by namespace if specified
          if (selectedNamespace && selectedNamespace !== 'all') {
            mockResources = mockResources.filter(
              resource => resource.metadata?.namespace === selectedNamespace || resource.kind === 'Namespace'
            );
          }
          
          _setResources(mockResources);
          const hierarchy = buildResourceHierarchy(mockResources);
          setHierarchyNodes(hierarchy);
          setIsLoading(false);
        }, 500);
      } else {
        // Fetch from multiple API endpoints to build comprehensive resource tree
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const [
          nodesResponse,
          podsResponse, 
          deploymentsResponse,
          servicesResponse,
          namespacesResponse,
          storageResponse
        ] = await Promise.allSettled([
          fetch(API_ENDPOINTS.KUBERNETES.NODES, { headers }),
          fetch(API_ENDPOINTS.KUBERNETES.PODS, { headers }),
          fetch(API_ENDPOINTS.KUBERNETES.DEPLOYMENTS, { headers }),
          fetch(API_ENDPOINTS.KUBERNETES.SERVICES, { headers }),
          fetch(API_ENDPOINTS.KUBERNETES.NAMESPACES, { headers }),
          fetch(API_ENDPOINTS.KUBERNETES.STORAGE, { headers })
        ]);
        
        const allResources: KubernetesResource[] = [];
        
        // Process each API response
        if (nodesResponse.status === 'fulfilled' && nodesResponse.value.ok) {
          const data = await nodesResponse.value.json();
          allResources.push(...(data.data || data || []));
        }
        
        if (podsResponse.status === 'fulfilled' && podsResponse.value.ok) {
          const data = await podsResponse.value.json();
          allResources.push(...(data.data || data || []));
        }
        
        if (deploymentsResponse.status === 'fulfilled' && deploymentsResponse.value.ok) {
          const data = await deploymentsResponse.value.json();
          allResources.push(...(data.data || data || []));
        }
        
        if (servicesResponse.status === 'fulfilled' && servicesResponse.value.ok) {
          const data = await servicesResponse.value.json();
          allResources.push(...(data.data || data || []));
        }
        
        if (namespacesResponse.status === 'fulfilled' && namespacesResponse.value.ok) {
          const data = await namespacesResponse.value.json();
          allResources.push(...(data.data || data || []));
        }
        
        if (storageResponse.status === 'fulfilled' && storageResponse.value.ok) {
          const data = await storageResponse.value.json();
          allResources.push(...(data.data || data || []));
        }
        
        // Filter by namespace if specified
        let filteredResources = allResources;
        if (selectedNamespace && selectedNamespace !== 'all') {
          filteredResources = allResources.filter(
            resource => resource.metadata?.namespace === selectedNamespace || 
                       resource.kind === 'Namespace' ||
                       resource.kind === 'Node' // Nodes are cluster-scoped
          );
        }
        
        _setResources(filteredResources);
        const hierarchy = buildResourceHierarchy(filteredResources);
        setHierarchyNodes(hierarchy);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
      // Fallback to mock data on error
      let mockResources = generateMockResources();
      
      if (selectedNamespace && selectedNamespace !== 'all') {
        mockResources = mockResources.filter(
          resource => resource.metadata?.namespace === selectedNamespace || resource.kind === 'Namespace'
        );
      }
      
      _setResources(mockResources);
      const hierarchy = buildResourceHierarchy(mockResources);
      setHierarchyNodes(hierarchy);
      setIsLoading(false);
    }
  };

  const handleNodeSelect = (node: HierarchyNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  const handleAction = (action: string) => {
    if (selectedNode) {
      handleResourceAction(action, selectedNode.kind, selectedNode.name, selectedNode.namespace);
      
      // Handle UI-specific actions
      if (action === 'edit' || action === 'describe') {
        setShowManifest(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonLoader variant="table" count={8} />
          </div>
          <div>
            <SkeletonLoader variant="card" count={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Tree */}
        <div className="lg:col-span-2">
          <ResourceHierarchy
            nodes={hierarchyNodes}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNode?.id}
            maxDepth={4}
            showNamespace={!selectedNamespace || selectedNamespace === 'all'}
          />
        </div>

        {/* Selected Resource Details */}
        <div className="border border-white bg-black">
          <div className="border-b border-white/20 px-4 py-2">
            <h3 className="font-mono text-sm font-bold">RESOURCE DETAILS</h3>
          </div>
          
          <div className="p-4">
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-mono text-sm font-bold mb-2">{selectedNode.name}</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kind:</span>
                      <span>{selectedNode.kind}</span>
                    </div>
                    {selectedNode.namespace && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Namespace:</span>
                        <span>{selectedNode.namespace}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="capitalize">{selectedNode.status}</span>
                    </div>
                    {selectedNode.metadata?.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span>{new Date(selectedNode.metadata.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedNode.children && selectedNode.children.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Children:</span>
                        <span>{selectedNode.children.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Labels */}
                {selectedNode.metadata?.labels && Object.keys(selectedNode.metadata.labels).length > 0 && (
                  <div>
                    <h5 className="font-mono text-xs font-bold mb-2">LABELS</h5>
                    <div className="space-y-1">
                      {Object.entries(selectedNode.metadata.labels).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs font-mono">
                          <span className="text-gray-500 truncate mr-2">{key}:</span>
                          <span className="truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-white/20">
                  <ResourceActions
                    resourceKind={selectedNode.kind}
                    resourceName={selectedNode.name}
                    namespace={selectedNode.namespace}
                    onAction={handleAction}
                    variant="buttons"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-sm font-mono">Select a resource to view details</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manifest Viewer */}
      {selectedNode && showManifest && (
        <ManifestViewer
          title={`${selectedNode.kind}: ${selectedNode.name}`}
          data={generateSampleManifest(selectedNode.kind, selectedNode.name, selectedNode.namespace)}
          defaultFormat="yaml"
          maxHeight="500px"
        />
      )}
    </div>
  );
};

export default ResourceTree;