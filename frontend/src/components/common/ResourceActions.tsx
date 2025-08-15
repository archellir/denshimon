import type { FC } from 'react';
import { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  FileText, 
  Terminal, 
  Eye, 
  Play,
  RotateCw,
  Scale,
  Copy
} from 'lucide-react';

export interface ResourceAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  disabled?: boolean;
  dangerous?: boolean;
  tooltip?: string;
}

interface ResourceActionsProps {
  resourceKind: string;
  resourceName: string;
  namespace?: string;
  onAction: (action: string) => void;
  variant?: 'buttons' | 'dropdown' | 'icons';
  className?: string;
}

const ResourceActions: FC<ResourceActionsProps> = ({
  resourceKind,
  resourceName: _resourceName,
  namespace: _namespace,
  onAction,
  variant = 'buttons',
  className = ''
}) => {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const getActionsForResource = (kind: string): ResourceAction[] => {
    const commonActions: ResourceAction[] = [
      { id: 'describe', label: 'Describe', icon: FileText, tooltip: 'Show detailed information' },
      { id: 'edit', label: 'Edit', icon: Edit, tooltip: 'Edit YAML manifest' },
      { id: 'delete', label: 'Delete', icon: Trash2, dangerous: true, tooltip: 'Delete resource' },
    ];

    const kindLower = kind.toLowerCase();

    // Pod-specific actions
    if (kindLower === 'pod') {
      return [
        { id: 'logs', label: 'Logs', icon: FileText, tooltip: 'View pod logs' },
        { id: 'exec', label: 'Shell', icon: Terminal, tooltip: 'Execute shell in pod' },
        { id: 'describe', label: 'Describe', icon: Eye, tooltip: 'Show detailed information' },
        { id: 'restart', label: 'Restart', icon: RotateCw, dangerous: true, tooltip: 'Restart pod' },
        { id: 'delete', label: 'Delete', icon: Trash2, dangerous: true, tooltip: 'Delete pod' },
      ];
    }

    // Deployment/StatefulSet/DaemonSet actions
    if (['deployment', 'statefulset', 'daemonset'].includes(kindLower)) {
      return [
        ...commonActions.slice(0, 2),
        { id: 'scale', label: 'Scale', icon: Scale, tooltip: 'Scale replicas' },
        { id: 'restart', label: 'Restart', icon: RotateCw, tooltip: 'Restart all pods' },
        { id: 'rollback', label: 'Rollback', icon: RotateCw, tooltip: 'Rollback to previous version' },
        ...commonActions.slice(2),
      ];
    }

    // Service actions
    if (kindLower === 'service') {
      return [
        { id: 'describe', label: 'Describe', icon: Eye, tooltip: 'Show detailed information' },
        { id: 'endpoints', label: 'Endpoints', icon: FileText, tooltip: 'View service endpoints' },
        { id: 'edit', label: 'Edit', icon: Edit, tooltip: 'Edit YAML manifest' },
        { id: 'delete', label: 'Delete', icon: Trash2, dangerous: true, tooltip: 'Delete service' },
      ];
    }

    // Job/CronJob actions
    if (['job', 'cronjob'].includes(kindLower)) {
      return [
        { id: 'describe', label: 'Describe', icon: Eye, tooltip: 'Show detailed information' },
        { id: 'logs', label: 'Logs', icon: FileText, tooltip: 'View job logs' },
        { id: 'trigger', label: 'Trigger', icon: Play, tooltip: 'Trigger job manually' },
        { id: 'edit', label: 'Edit', icon: Edit, tooltip: 'Edit YAML manifest' },
        { id: 'delete', label: 'Delete', icon: Trash2, dangerous: true, tooltip: 'Delete job' },
      ];
    }

    // ConfigMap/Secret actions
    if (['configmap', 'secret'].includes(kindLower)) {
      return [
        { id: 'describe', label: 'Describe', icon: Eye, tooltip: 'Show detailed information' },
        { id: 'data', label: 'View Data', icon: FileText, tooltip: 'View configuration data' },
        { id: 'copy', label: 'Copy', icon: Copy, tooltip: 'Copy to another namespace' },
        { id: 'edit', label: 'Edit', icon: Edit, tooltip: 'Edit YAML manifest' },
        { id: 'delete', label: 'Delete', icon: Trash2, dangerous: true, tooltip: 'Delete resource' },
      ];
    }

    // PersistentVolumeClaim actions
    if (kindLower === 'persistentvolumeclaim' || kindLower === 'pvc') {
      return [
        { id: 'describe', label: 'Describe', icon: Eye, tooltip: 'Show detailed information' },
        { id: 'expand', label: 'Expand', icon: Scale, tooltip: 'Expand volume size' },
        { id: 'snapshot', label: 'Snapshot', icon: Copy, tooltip: 'Create volume snapshot' },
        { id: 'delete', label: 'Delete', icon: Trash2, dangerous: true, tooltip: 'Delete PVC' },
      ];
    }

    // Default actions for other resources
    return commonActions;
  };

  const handleAction = (actionId: string, isDangerous: boolean) => {
    if (isDangerous && showConfirm !== actionId) {
      setShowConfirm(actionId);
      // Auto-hide confirm after 5 seconds
      setTimeout(() => setShowConfirm(null), 5000);
      return;
    }
    
    setShowConfirm(null);
    onAction(actionId);
  };

  const actions = getActionsForResource(resourceKind);

  // Render as icon buttons
  if (variant === 'icons') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {actions.map((action) => {
          const Icon = action.icon;
          const isConfirming = showConfirm === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id, action.dangerous || false)}
              disabled={action.disabled}
              title={isConfirming ? 'Click again to confirm' : action.tooltip}
              className={`p-1 transition-colors ${
                isConfirming
                  ? 'bg-red-500 text-white'
                  : action.dangerous
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-white hover:bg-white/10'
              } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    );
  }

  // Render as dropdown menu
  if (variant === 'dropdown') {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 border border-white/30 text-xs font-mono hover:bg-white/10 transition-colors flex items-center space-x-1"
        >
          <span>ACTIONS</span>
          <Terminal size={12} />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-black border border-white min-w-[150px] z-10">
            {actions.map((action) => {
              const Icon = action.icon;
              const isConfirming = showConfirm === action.id;
              
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    handleAction(action.id, action.dangerous || false);
                    if (!action.dangerous || isConfirming) {
                      setIsOpen(false);
                    }
                  }}
                  disabled={action.disabled}
                  className={`w-full px-3 py-2 text-xs font-mono text-left flex items-center space-x-2 transition-colors ${
                    isConfirming
                      ? 'bg-red-500 text-white'
                      : action.dangerous
                      ? 'text-red-500 hover:bg-red-500/10'
                      : 'text-white hover:bg-white/10'
                  } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon size={12} />
                  <span>{isConfirming ? 'Confirm?' : action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default: Render as buttons
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {actions.map((action) => {
        const Icon = action.icon;
        const isConfirming = showConfirm === action.id;
        
        return (
          <button
            key={action.id}
            onClick={() => handleAction(action.id, action.dangerous || false)}
            disabled={action.disabled}
            title={action.tooltip}
            className={`px-3 py-1 border text-xs font-mono transition-colors flex items-center justify-center space-x-2 ${
              isConfirming
                ? 'bg-red-500 text-white border-red-500'
                : action.dangerous
                ? 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                : 'border-white/30 hover:bg-white/10'
            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon size={12} />
            <span>{isConfirming ? 'CONFIRM?' : action.label.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ResourceActions;

// Action handler utility
export const handleResourceAction = async (
  action: string,
  resourceKind: string,
  resourceName: string,
  namespace?: string
) => {
  const resourceId = namespace ? `${namespace}/${resourceName}` : resourceName;
  
  console.log(`Executing action: ${action} on ${resourceKind} ${resourceId}`);
  
  // In a real implementation, these would make API calls
  switch (action) {
    case 'describe':
      console.log(`kubectl describe ${resourceKind} ${resourceId}`);
      // API call to get resource details
      break;
      
    case 'logs':
      console.log(`kubectl logs ${resourceId}`);
      // API call to stream logs
      break;
      
    case 'exec':
      console.log(`kubectl exec -it ${resourceId} -- /bin/sh`);
      // Open terminal connection
      break;
      
    case 'edit':
      console.log(`kubectl edit ${resourceKind} ${resourceId}`);
      // Open YAML editor
      break;
      
    case 'delete':
      console.log(`kubectl delete ${resourceKind} ${resourceId}`);
      // API call to delete resource
      break;
      
    case 'scale':
      console.log(`kubectl scale ${resourceKind} ${resourceId} --replicas=?`);
      // Open scale dialog
      break;
      
    case 'restart':
      console.log(`kubectl rollout restart ${resourceKind} ${resourceId}`);
      // API call to restart
      break;
      
    case 'rollback':
      console.log(`kubectl rollout undo ${resourceKind} ${resourceId}`);
      // API call to rollback
      break;
      
    default:
      console.log(`Unknown action: ${action}`);
  }
};