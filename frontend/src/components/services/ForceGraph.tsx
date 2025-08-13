import { useEffect, useRef, useState, useCallback, FC } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ServiceNode, ServiceConnection } from '@/types/serviceMesh';
import { 
  CircuitBreakerStatus, 
  NetworkProtocol, 
  ServiceType as MeshServiceType, 
  SERVICE_TYPE_COLORS, 
  TRAFFIC_COLORS, 
  LATENCY_HEATMAP_COLORS,
  SERVICE_ICONS, 
  GRAPH_CONFIG,
  BASE_COLORS 
} from '@/constants';

interface ForceGraphProps {
  services: ServiceNode[];
  connections: ServiceConnection[];
  selectedService: string | null;
  onServiceSelect: (serviceId: string | null) => void;
  isLive?: boolean;
  showDependencyPaths?: boolean;
  showCriticalPath?: boolean;
  showSinglePointsOfFailure?: boolean;
  showLatencyHeatmap?: boolean;
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  status: string;
  metrics: {
    requestRate: number;
    errorRate: number;
    latency: number;
  };
  circuitBreaker: string;
  size: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  protocol: string;
  encrypted: boolean;
  mTLS: boolean;
  errorRate: number;
}

const ForceGraph: FC<ForceGraphProps> = ({
  services,
  connections,
  selectedService,
  onServiceSelect,
  isLive = false,
  showDependencyPaths = true,
  showCriticalPath = true,
  showSinglePointsOfFailure = true,
  showLatencyHeatmap = true
}) => {
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [animationFrame, setAnimationFrame] = useState(0);
  const [dependencyPaths, setDependencyPaths] = useState<string[][]>([]);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const [singlePointsOfFailure, setSinglePointsOfFailure] = useState<string[]>([]);

  // Dependency analysis functions
  const findAllPaths = useCallback((connections: ServiceConnection[], startId: string, endId: string, visited: Set<string> = new Set()): string[][] => {
    if (startId === endId) return [[startId]];
    if (visited.has(startId)) return [];
    
    visited.add(startId);
    const paths: string[][] = [];
    
    const outgoingConnections = connections.filter(conn => conn.source === startId);
    for (const conn of outgoingConnections) {
      const subPaths = findAllPaths(connections, conn.target, endId, new Set(visited));
      for (const subPath of subPaths) {
        paths.push([startId, ...subPath]);
      }
    }
    
    return paths;
  }, []);

  const findCriticalPath = useCallback((services: ServiceNode[], connections: ServiceConnection[]): string[] => {
    // Find path with highest cumulative request rate or lowest redundancy
    const frontendServices = services.filter(s => s.type === MeshServiceType.FRONTEND);
    const databaseServices = services.filter(s => s.type === MeshServiceType.DATABASE);
    
    if (frontendServices.length === 0 || databaseServices.length === 0) return [];
    
    let criticalPath: string[] = [];
    let maxCriticality = 0;
    
    for (const frontend of frontendServices) {
      for (const database of databaseServices) {
        const paths = findAllPaths(connections, frontend.id, database.id);
        for (const path of paths) {
          // Calculate criticality based on request rate and service importance
          const pathCriticality = path.reduce((sum, serviceId) => {
            const service = services.find(s => s.id === serviceId);
            return sum + (service?.metrics.requestRate || 0) * (service?.type === MeshServiceType.GATEWAY ? 2 : 1);
          }, 0);
          
          if (pathCriticality > maxCriticality) {
            maxCriticality = pathCriticality;
            criticalPath = path;
          }
        }
      }
    }
    
    return criticalPath;
  }, [findAllPaths]);

  const findSinglePointsOfFailure = useCallback((services: ServiceNode[], connections: ServiceConnection[]): string[] => {
    const spofs: string[] = [];
    
    for (const service of services) {
      // Count incoming and outgoing connections
      const incomingCount = connections.filter(conn => conn.target === service.id).length;
      const outgoingCount = connections.filter(conn => conn.source === service.id).length;
      const totalConnections = incomingCount + outgoingCount;
      
      // A service is a SPOF if:
      // 1. It's a gateway with high connectivity
      // 2. It's the only service of its type with multiple dependents
      // 3. It has very high request rate and multiple dependents
      const isDatabaseBottleneck = service.type === MeshServiceType.DATABASE && incomingCount > 2;
      const isGatewayBottleneck = service.type === MeshServiceType.GATEWAY && totalConnections > 3;
      const isHighTrafficBottleneck = service.metrics.requestRate > 100 && incomingCount > 1;
      const isSingleServiceType = services.filter(s => s.type === service.type).length === 1 && totalConnections > 1;
      
      if (isDatabaseBottleneck || isGatewayBottleneck || isHighTrafficBottleneck || isSingleServiceType) {
        spofs.push(service.id);
      }
    }
    
    return spofs;
  }, []);

  // Calculate node size based on request rate
  const getNodeSize = (service: ServiceNode): number => {
    const { BASE_SIZE, SCALE_FACTOR } = GRAPH_CONFIG.NODE;
    return BASE_SIZE + Math.log10(service.metrics.requestRate + 1) * SCALE_FACTOR;
  };

  // Get latency heatmap color based on latency value
  const getLatencyHeatmapColor = (latency: number): string => {
    if (latency < GRAPH_CONFIG.LATENCY.EXCELLENT_THRESHOLD) {
      return LATENCY_HEATMAP_COLORS.EXCELLENT;
    } else if (latency < GRAPH_CONFIG.LATENCY.GOOD_THRESHOLD) {
      return LATENCY_HEATMAP_COLORS.GOOD;
    } else if (latency < GRAPH_CONFIG.LATENCY.MODERATE_THRESHOLD) {
      return LATENCY_HEATMAP_COLORS.MODERATE;
    } else if (latency < GRAPH_CONFIG.LATENCY.SLOW_THRESHOLD) {
      return LATENCY_HEATMAP_COLORS.SLOW;
    } else {
      return LATENCY_HEATMAP_COLORS.CRITICAL;
    }
  };

  // Get node color based on service type and status
  const getNodeColor = (service: ServiceNode): string => {
    // If latency heatmap is enabled, use latency-based coloring
    if (showLatencyHeatmap) {
      return getLatencyHeatmapColor(service.metrics.latency.p95);
    }

    if (service.circuitBreaker.status === CircuitBreakerStatus.OPEN) {
      return BASE_COLORS.RED;
    }
    
    switch (service.status) {
      case 'error':
        return BASE_COLORS.RED;
      case 'warning':
        return BASE_COLORS.YELLOW;
      case 'healthy':
        return SERVICE_TYPE_COLORS[service.type as keyof typeof SERVICE_TYPE_COLORS] || BASE_COLORS.GRAY;
      default:
        return BASE_COLORS.GRAY;
    }
  };

  // Transform data for force graph
  useEffect(() => {
    const nodes: GraphNode[] = services.map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      status: service.status,
      metrics: {
        requestRate: service.metrics.requestRate,
        errorRate: service.metrics.errorRate,
        latency: service.metrics.latency.p95
      },
      circuitBreaker: service.circuitBreaker.status,
      size: getNodeSize(service),
      color: getNodeColor(service)
    }));

    const links: GraphLink[] = connections.map(conn => ({
      source: conn.source,
      target: conn.target,
      value: Math.log10(conn.metrics.requestRate + 1) * 2,
      protocol: conn.protocol,
      encrypted: conn.security.encrypted,
      mTLS: conn.security.mTLS,
      errorRate: conn.metrics.errorRate
    }));

    setGraphData({ nodes, links });
  }, [services, connections]);

  // Analyze dependencies when data changes
  useEffect(() => {
    if (services.length > 0 && connections.length > 0) {
      // Find critical path
      if (showCriticalPath) {
        const critical = findCriticalPath(services, connections);
        setCriticalPath(critical);
      }
      
      // Find single points of failure
      if (showSinglePointsOfFailure) {
        const spofs = findSinglePointsOfFailure(services, connections);
        setSinglePointsOfFailure(spofs);
      }
      
      // Calculate dependency paths for selected service
      if (selectedService && showDependencyPaths) {
        const allPaths: string[][] = [];
        // Find all paths from selected service
        const outgoingConnections = connections.filter(conn => conn.source === selectedService);
        for (const conn of outgoingConnections) {
          const paths = findAllPaths(connections, selectedService, conn.target);
          allPaths.push(...paths);
        }
        // Find all paths to selected service
        const incomingConnections = connections.filter(conn => conn.target === selectedService);
        for (const conn of incomingConnections) {
          const paths = findAllPaths(connections, conn.source, selectedService);
          allPaths.push(...paths);
        }
        setDependencyPaths(allPaths);
      } else {
        setDependencyPaths([]);
      }
    }
  }, [services, connections, selectedService, showCriticalPath, showSinglePointsOfFailure, showDependencyPaths, findCriticalPath, findSinglePointsOfFailure, findAllPaths]);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('force-graph-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.min(container.clientHeight, 600)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Node click handler
  const handleNodeClick = useCallback((node: GraphNode) => {
    onServiceSelect(node.id === selectedService ? null : node.id);
  }, [selectedService, onServiceSelect]);

  // Custom node rendering
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
    
    // Node circle
    const isSelected = node.id === selectedService;
    const isHovered = node.id === hoveredNode;
    const isInCriticalPath = showCriticalPath && criticalPath.includes(node.id);
    const isSpof = showSinglePointsOfFailure && singlePointsOfFailure.includes(node.id);
    const isInDependencyPath = showDependencyPaths && dependencyPaths.some(path => path.includes(node.id));
    
    let nodeSize = node.size;
    if (isSelected) nodeSize *= 1.5;
    if (isSpof) nodeSize *= 1.3;
    
    // Critical path highlighting
    if (isInCriticalPath) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 1.5, 0, 2 * Math.PI, false);
      ctx.strokeStyle = BASE_COLORS.YELLOW;
      ctx.lineWidth = 1 / globalScale;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Single point of failure highlighting
    if (isSpof) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 1.2, 0, 2 * Math.PI, false);
      ctx.strokeStyle = BASE_COLORS.RED;
      ctx.lineWidth = 0.8 / globalScale;
      ctx.setLineDash([1, 1]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Dependency path highlighting  
    if (isInDependencyPath && selectedService) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 0.8, 0, 2 * Math.PI, false);
      ctx.strokeStyle = BASE_COLORS.CYAN + '80';
      ctx.lineWidth = 0.5 / globalScale;
      ctx.stroke();
    }
    
    // Outer ring for selection/hover
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 0.5, 0, 2 * Math.PI, false);
      ctx.strokeStyle = isSelected ? '#ffffff' : '#ffffff80';
      ctx.lineWidth = isSelected ? 0.8 / globalScale : 0.5 / globalScale;
      ctx.stroke();
    }
    
    // Circuit breaker indicator
    if (node.circuitBreaker !== CircuitBreakerStatus.CLOSED) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 1.8, 0, 2 * Math.PI, false);
      
      if (node.circuitBreaker === CircuitBreakerStatus.OPEN) {
        ctx.strokeStyle = BASE_COLORS.RED;
        ctx.setLineDash([1.5, 1.5]);
      } else if (node.circuitBreaker === CircuitBreakerStatus.HALF_OPEN) {
        ctx.strokeStyle = BASE_COLORS.YELLOW;
        ctx.setLineDash([3, 1, 1, 1]);
      }
      
      ctx.lineWidth = 0.8 / globalScale;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Main node
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    // Node border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();
    
    // Service type icon (simplified representation)
    const iconSize = nodeSize * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const iconChar = SERVICE_ICONS[node.type as keyof typeof SERVICE_ICONS] || '●';
    
    ctx.font = `${iconSize * 2}px Arial`;
    ctx.fillText(iconChar, node.x, node.y);
    
    // Label
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Background for label
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = '#00000099';
    ctx.fillRect(node.x - textWidth / 2 - 2, node.y + nodeSize + 2, textWidth + 4, fontSize + 4);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, node.x, node.y + nodeSize + 4);
    
    // Error rate indicator
    if (node.metrics.errorRate > 5) {
      ctx.beginPath();
      ctx.arc(node.x + nodeSize * 0.7, node.y - nodeSize * 0.7, 1.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  }, [selectedService, hoveredNode, showCriticalPath, criticalPath, showSinglePointsOfFailure, singlePointsOfFailure, showDependencyPaths, dependencyPaths, showLatencyHeatmap]);

  // Custom link rendering with animated traffic
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    
    if (!start || !end || !start.x || !start.y || !end.x || !end.y) return;
    
    // Check if link is part of critical path or dependency path
    const isInCriticalPath = showCriticalPath && criticalPath.length > 1 && (() => {
      for (let i = 0; i < criticalPath.length - 1; i++) {
        if ((criticalPath[i] === link.source.id && criticalPath[i + 1] === link.target.id) ||
            (criticalPath[i] === link.target.id && criticalPath[i + 1] === link.source.id)) {
          return true;
        }
      }
      return false;
    })();
    
    const isInDependencyPath = showDependencyPaths && selectedService && dependencyPaths.some(path => {
      for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === link.source.id && path[i + 1] === link.target.id) ||
            (path[i] === link.target.id && path[i + 1] === link.source.id)) {
          return true;
        }
      }
      return false;
    });
    
    // Link color based on protocol, health, and dependency analysis
    let linkColor = '#ffffff30';
    let lineWidth = Math.max(link.value, 0.5) / globalScale;
    
    if (isInCriticalPath) {
      linkColor = BASE_COLORS.YELLOW + '80';
      lineWidth = Math.max(lineWidth * 2, 2 / globalScale);
    } else if (isInDependencyPath) {
      linkColor = BASE_COLORS.CYAN + '60';
      lineWidth = Math.max(lineWidth * 1.5, 1.5 / globalScale);
    } else if (link.errorRate > 5) {
      linkColor = '#ef444460';
    } else if (link.mTLS) {
      linkColor = '#10b98160';
    } else if (link.encrypted) {
      linkColor = '#3b82f660';
    }
    
    // Draw link
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = lineWidth;
    
    if (link.protocol === NetworkProtocol.GRPC) {
      ctx.setLineDash([5, 3]);
    }
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Animated traffic particles
    if (isLive) {
      const particleCount = Math.ceil(link.value / 2);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      
      for (let i = 0; i < particleCount; i++) {
        const offset = ((animationFrame + i * (100 / particleCount)) % 100) / 100;
        const x = start.x + dx * offset;
        const y = start.y + dy * offset;
        
        // Particle glow
        const particleSize = GRAPH_CONFIG.ANIMATION.PARTICLE_SIZE / globalScale;
        const glowSize = GRAPH_CONFIG.ANIMATION.GLOW_SIZE / globalScale;
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, 2 * Math.PI);
        
        let particleColor: string = TRAFFIC_COLORS.HEALTHY;
        if (link.errorRate > GRAPH_CONFIG.TRAFFIC.ERROR_THRESHOLD_HIGH) {
          particleColor = TRAFFIC_COLORS.ERROR;
        } else if (link.errorRate > GRAPH_CONFIG.TRAFFIC.ERROR_THRESHOLD_MEDIUM) {
          particleColor = TRAFFIC_COLORS.WARNING;
        } else if (link.mTLS) {
          particleColor = TRAFFIC_COLORS.MTLS;
        }
        
        ctx.fillStyle = particleColor + GRAPH_CONFIG.TRAFFIC.PARTICLE_OPACITY;
        ctx.fill();
        
        // Core particle
        ctx.beginPath();
        ctx.arc(x, y, particleSize, 0, 2 * Math.PI);
        ctx.fillStyle = particleColor;
        ctx.fill();
      }
    }
    
    // Draw arrow for direction
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 10 / globalScale;
    const arrowAngle = Math.PI / 6;
    
    const nodeRadius = end.size || 8;
    const arrowX = end.x - Math.cos(angle) * (nodeRadius + 5);
    const arrowY = end.y - Math.sin(angle) * (nodeRadius + 5);
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle - arrowAngle),
      arrowY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle + arrowAngle),
      arrowY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  }, [isLive, animationFrame, showCriticalPath, criticalPath, showDependencyPaths, dependencyPaths, selectedService]);

  // Animation frame counter for traffic flow
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setAnimationFrame(prev => (prev + 1) % 100);
      }, GRAPH_CONFIG.ANIMATION.FRAME_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [isLive]);

  // Auto-fit to viewport when data changes
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(1000, GRAPH_CONFIG.ANIMATION.AUTO_FIT_PADDING);
        }
      }, GRAPH_CONFIG.ANIMATION.AUTO_FIT_DELAY);
    }
  }, [graphData]);

  // Auto-rotate animation for live mode
  useEffect(() => {
    if (isLive && graphRef.current) {
      const interval = setInterval(() => {
        if (graphRef.current) {
          graphRef.current.zoom(1, 1000);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <div id="force-graph-container" className="w-full h-full relative bg-black border border-white">
      <div className="absolute top-2 left-2 z-20 bg-black/80 border border-white p-2">
        <div className="text-xs font-mono space-y-1">
          <div className="text-white/60 font-bold mb-1">SERVICE TYPES</div>
          {Object.entries(SERVICE_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </div>
          ))}
          
          <div className="text-white/60 font-bold mt-2 mb-1">TRAFFIC</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: TRAFFIC_COLORS.HEALTHY }} />
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: TRAFFIC_COLORS.MTLS }} />
            <span>mTLS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: TRAFFIC_COLORS.WARNING }} />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: TRAFFIC_COLORS.ERROR }} />
            <span>Errors</span>
          </div>
          
          {(showCriticalPath || showSinglePointsOfFailure || showDependencyPaths) && (
            <>
              <div className="text-white/60 font-bold mt-2 mb-1">DEPENDENCIES</div>
              {showCriticalPath && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 border-dashed border-yellow-500" style={{ borderWidth: '1px', borderColor: BASE_COLORS.YELLOW }} />
                  <span>Critical Path</span>
                </div>
              )}
              {showSinglePointsOfFailure && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 border-dashed border-red-500" style={{ borderWidth: '1px', borderColor: BASE_COLORS.RED }} />
                  <span>SPOF Risk</span>
                </div>
              )}
              {showDependencyPaths && selectedService && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1" style={{ backgroundColor: BASE_COLORS.CYAN + '80' }} />
                  <span>Dependencies</span>
                </div>
              )}
            </>
          )}
          
          <div className="text-white/60 font-bold mt-2 mb-1">CIRCUIT BREAKERS</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-dashed border-red-500" style={{ borderWidth: '1px', borderColor: BASE_COLORS.RED }} />
            <span>Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-dashed border-yellow-500" style={{ borderWidth: '1px', borderColor: BASE_COLORS.YELLOW, borderStyle: 'dashed' }} />
            <span>Half-Open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1" style={{ backgroundColor: BASE_COLORS.GREEN + '80' }} />
            <span>Closed</span>
          </div>
          
          {showLatencyHeatmap && (
            <>
              <div className="text-white/60 font-bold mt-2 mb-1">LATENCY HEATMAP</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LATENCY_HEATMAP_COLORS.EXCELLENT }} />
                <span>&lt;50ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LATENCY_HEATMAP_COLORS.GOOD }} />
                <span>50-100ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LATENCY_HEATMAP_COLORS.MODERATE }} />
                <span>100-200ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LATENCY_HEATMAP_COLORS.SLOW }} />
                <span>200-500ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LATENCY_HEATMAP_COLORS.CRITICAL }} />
                <span>&gt;500ms</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {isLive && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-green-400">LIVE</span>
        </div>
      )}
      
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel=""
        nodeAutoColorBy="type"
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        linkCanvasObject={linkCanvasObject}
        linkCanvasObjectMode={() => 'replace'}
        onNodeClick={handleNodeClick}
        onNodeHover={(node: any) => setHoveredNode(node?.id || null)}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#000000"
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        minZoom={GRAPH_CONFIG.NODE.MIN_ZOOM}
        maxZoom={GRAPH_CONFIG.NODE.MAX_ZOOM}
        cooldownTicks={GRAPH_CONFIG.PHYSICS.COOLDOWN_TICKS}
        d3AlphaDecay={GRAPH_CONFIG.PHYSICS.ALPHA_DECAY}
        d3VelocityDecay={GRAPH_CONFIG.PHYSICS.VELOCITY_DECAY}
        nodeRelSize={GRAPH_CONFIG.NODE.BASE_SIZE}
      />
    </div>
  );
};

export default ForceGraph;