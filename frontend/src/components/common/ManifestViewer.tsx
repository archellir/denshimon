import type { FC } from 'react';
import { useState } from 'react';
import { FileText, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { ManifestData } from '@/types';

export type ManifestFormat = 'yaml' | 'json';

interface ManifestViewerProps {
  title: string;
  data: ManifestData;
  defaultFormat?: ManifestFormat;
  className?: string;
  showFormatToggle?: boolean;
  showActions?: boolean;
  maxHeight?: string;
}

const ManifestViewer: FC<ManifestViewerProps> = ({
  title,
  data,
  defaultFormat = 'yaml',
  className = '',
  showFormatToggle = true,
  showActions = true,
  maxHeight = '400px'
}) => {
  const [format, setFormat] = useState<ManifestFormat>(defaultFormat);
  const [isVisible, setIsVisible] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  // Convert object to YAML-like string (simplified)
  const toYaml = (obj: unknown, indent = 0): string => {
    const spaces = '  '.repeat(indent);
    
    if (obj === null || obj === undefined) {
      return 'null';
    }
    
    if (typeof obj === 'string') {
      return obj.includes('\n') || obj.includes('"') ? 
        `|\n${spaces}  ${obj.replace(/\n/g, `\n${spaces}  `)}` : 
        obj;
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return (obj as unknown[]).map(item => `${spaces}- ${toYaml(item, indent + 1).replace(/^\s+/, '')}`).join('\n');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const entries = Object.entries(obj as Record<string, unknown>);
      if (entries.length === 0) return '{}';
      
      return entries.map(([key, value]) => {
        const yamlValue = toYaml(value, indent + 1);
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return `${spaces}${key}:\n${yamlValue}`;
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          return `${spaces}${key}:\n${yamlValue}`;
        } else {
          return `${spaces}${key}: ${yamlValue}`;
        }
      }).join('\n');
    }
    
    return String(obj);
  };

  const formatData = () => {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      return toYaml(data);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatData());
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      // console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const content = formatData();
    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    const blob = new Blob([content], { type: `application/${format}` });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`border border-white bg-black ${className}`}>
      {/* Header */}
      <div className="border-b border-white/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText size={16} />
          <span className="font-mono text-sm font-bold">{title.toUpperCase()}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Format Toggle */}
          {showFormatToggle && (
            <div className="flex border border-white/30">
              <button
                onClick={() => setFormat('yaml')}
                className={`px-2 py-1 text-xs font-mono transition-colors ${
                  format === 'yaml' ? 'bg-white text-black' : 'hover:bg-white/10'
                }`}
              >
                YAML
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`px-2 py-1 text-xs font-mono border-l border-white/30 transition-colors ${
                  format === 'json' ? 'bg-white text-black' : 'hover:bg-white/10'
                }`}
              >
                JSON
              </button>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsVisible(!isVisible)}
                className="p-1 hover:bg-white/10 transition-colors"
                title={isVisible ? 'Hide' : 'Show'}
              >
                {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              
              {isVisible && (
                <>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-white/10 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={14} className={copyStatus === 'copied' ? 'text-green-500' : ''} />
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="p-1 hover:bg-white/10 transition-colors"
                    title="Download file"
                  >
                    <Download size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isVisible && (
        <div 
          className="p-4 overflow-auto font-mono text-sm"
          style={{ maxHeight }}
        >
          <pre className="text-gray-300 whitespace-pre-wrap">
            {formatData()}
          </pre>
        </div>
      )}
      
      {/* Copy Status */}
      {copyStatus === 'copied' && (
        <div className="absolute top-2 right-2 bg-green-500 text-black px-2 py-1 text-xs font-mono rounded">
          COPIED!
        </div>
      )}
    </div>
  );
};

export default ManifestViewer;

// Utility function to generate sample Kubernetes manifests
export const generateSampleManifest = (kind: string, name: string, namespace?: string) => {
  const baseManifest = {
    apiVersion: getApiVersion(kind),
    kind,
    metadata: {
      name,
      namespace: namespace || 'default',
      labels: {
        app: name,
        'app.kubernetes.io/name': name,
        'app.kubernetes.io/version': '1.0.0'
      },
      annotations: {
        'kubectl.kubernetes.io/last-applied-configuration': '{}',
        'deployment.kubernetes.io/revision': '1'
      },
      creationTimestamp: new Date().toISOString(),
      uid: `${Math.random().toString(36).substr(2, 8)}-${Math.random().toString(36).substr(2, 4)}-4${Math.random().toString(36).substr(2, 3)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}`
    }
  };

  switch (kind) {
    case 'Pod':
      return {
        ...baseManifest,
        spec: {
          containers: [
            {
              name: name,
              image: 'nginx:1.21',
              ports: [{ containerPort: 80 }],
              resources: {
                requests: { memory: '64Mi', cpu: '250m' },
                limits: { memory: '128Mi', cpu: '500m' }
              }
            }
          ]
        },
        status: {
          phase: 'Running',
          podIP: '10.244.0.10',
          startTime: new Date(Date.now() - 300000).toISOString()
        }
      };

    case 'Service':
      return {
        ...baseManifest,
        spec: {
          selector: { app: name },
          ports: [
            {
              port: 80,
              targetPort: 80,
              protocol: 'TCP'
            }
          ],
          type: 'ClusterIP'
        },
        status: {
          loadBalancer: {}
        }
      };

    case 'Deployment':
      return {
        ...baseManifest,
        spec: {
          replicas: 3,
          selector: {
            matchLabels: { app: name }
          },
          template: {
            metadata: {
              labels: { app: name }
            },
            spec: {
              containers: [
                {
                  name: name,
                  image: 'nginx:1.21',
                  ports: [{ containerPort: 80 }]
                }
              ]
            }
          }
        },
        status: {
          replicas: 3,
          readyReplicas: 3,
          availableReplicas: 3,
          observedGeneration: 1
        }
      };

    default:
      return baseManifest;
  }
};

const getApiVersion = (kind: string): string => {
  switch (kind) {
    case 'Pod':
    case 'Service':
    case 'ConfigMap':
    case 'Secret':
      return 'v1';
    case 'Deployment':
    case 'ReplicaSet':
      return 'apps/v1';
    case 'Ingress':
      return 'networking.k8s.io/v1';
    case 'HorizontalPodAutoscaler':
      return 'autoscaling/v2';
    default:
      return 'v1';
  }
};