import { useEffect, useRef, useState, useCallback, FC } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ServiceNode, ServiceConnection } from '@/types/serviceMesh';
import { ForceGraphNode, ForceGraphLink } from '@/types';
import { 
  CircuitBreakerStatus, 
  NetworkProtocol, 
  Status,
  SERVICE_TYPE_COLORS, 
  TRAFFIC_COLORS, 
  LATENCY_HEATMAP_COLORS,
  SERVICE_ICONS, 
  GRAPH_CONFIG,
  BASE_COLORS,
  CANVAS_CONSTANTS
} from '@constants';
import { 
  findCriticalPath, 
  findSinglePointsOfFailure, 
  calculateDependencyPaths 
} from '@utils/serviceMeshAnalysis';

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
  const [dimensions, setDimensions] = useState({ 
    width: GRAPH_CONFIG.DIMENSIONS.DEFAULT_WIDTH as number, 
    height: GRAPH_CONFIG.DIMENSIONS.DEFAULT_HEIGHT as number 
  });
  const [animationFrame, setAnimationFrame] = useState(0);
  const [dependencyPaths, setDependencyPaths] = useState<string[][]>([]);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const [singlePointsOfFailure, setSinglePointsOfFailure] = useState<string[]>([]);


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
      case Status.ERROR:
        return BASE_COLORS.RED;
      case Status.WARNING:
        return BASE_COLORS.YELLOW;
      case Status.HEALTHY:
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
        const allPaths = calculateDependencyPaths(connections, selectedService);
        setDependencyPaths(allPaths);
      } else {
        setDependencyPaths([]);
      }
    }
  }, [services, connections, selectedService, showCriticalPath, showSinglePointsOfFailure, showDependencyPaths]);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('force-graph-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.min(container.clientHeight, GRAPH_CONFIG.DIMENSIONS.MAX_HEIGHT)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Node click handler
  const handleNodeClick = useCallback((node: any) => {
    onServiceSelect(node.id === selectedService ? null : node.id);
  }, [selectedService, onServiceSelect]);

  // Custom node rendering
  const nodeCanvasObject = useCallback((node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    // Guard against undefined coordinates
    if (node.x === undefined || node.y === undefined) return;
    
    const label = node.name || '';
    const fontSize = GRAPH_CONFIG.NODE.FONT_SIZE / globalScale;
    ctx.font = `${fontSize}px ${CANVAS_CONSTANTS.FONTS.JETBRAINS_MONO}`;
    
    // Node circle
    const isSelected = node.id === selectedService;
    const isHovered = node.id === hoveredNode;
    const isInCriticalPath = showCriticalPath && criticalPath.includes(node.id);
    const isSpof = showSinglePointsOfFailure && singlePointsOfFailure.includes(node.id);
    const isInDependencyPath = showDependencyPaths && dependencyPaths.some(path => path.includes(node.id));
    
    let nodeSize = node.size || 5; // Default size if undefined
    if (isSelected) nodeSize *= GRAPH_CONFIG.NODE.SELECTION_MULTIPLIER;
    if (isSpof) nodeSize *= GRAPH_CONFIG.NODE.SPOF_MULTIPLIER;
    
    // Critical path highlighting
    if (isInCriticalPath) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + GRAPH_CONFIG.RINGS.CRITICAL_PATH_OFFSET, 0, 2 * Math.PI, false);
      ctx.strokeStyle = BASE_COLORS.YELLOW;
      ctx.lineWidth = GRAPH_CONFIG.RINGS.CRITICAL_PATH_WIDTH / globalScale;
      ctx.setLineDash(GRAPH_CONFIG.RINGS.CRITICAL_PATH_DASH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Single point of failure highlighting
    if (isSpof) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + GRAPH_CONFIG.RINGS.SPOF_OFFSET, 0, 2 * Math.PI, false);
      ctx.strokeStyle = BASE_COLORS.RED;
      ctx.lineWidth = GRAPH_CONFIG.RINGS.SPOF_WIDTH / globalScale;
      ctx.setLineDash(GRAPH_CONFIG.RINGS.SPOF_DASH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Dependency path highlighting  
    if (isInDependencyPath && selectedService) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + GRAPH_CONFIG.RINGS.DEPENDENCY_OFFSET, 0, 2 * Math.PI, false);
      ctx.strokeStyle = BASE_COLORS.CYAN + '80';
      ctx.lineWidth = GRAPH_CONFIG.RINGS.DEPENDENCY_WIDTH / globalScale;
      ctx.stroke();
    }
    
    // Outer ring for selection/hover
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + GRAPH_CONFIG.RINGS.SELECTION_OFFSET, 0, 2 * Math.PI, false);
      ctx.strokeStyle = isSelected ? CANVAS_CONSTANTS.COLORS.WHITE : CANVAS_CONSTANTS.COLORS.WHITE_80;
      ctx.lineWidth = (isSelected ? GRAPH_CONFIG.RINGS.SELECTION_WIDTH_SELECTED : GRAPH_CONFIG.RINGS.SELECTION_WIDTH_HOVER) / globalScale;
      ctx.stroke();
    }
    
    // Circuit breaker indicator
    if (node.circuitBreaker !== CircuitBreakerStatus.CLOSED) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + GRAPH_CONFIG.RINGS.CIRCUIT_BREAKER_OFFSET, 0, 2 * Math.PI, false);
      
      if (node.circuitBreaker === CircuitBreakerStatus.OPEN) {
        ctx.strokeStyle = BASE_COLORS.RED;
        ctx.setLineDash(GRAPH_CONFIG.RINGS.CIRCUIT_BREAKER_DASH);
      } else if (node.circuitBreaker === CircuitBreakerStatus.HALF_OPEN) {
        ctx.strokeStyle = BASE_COLORS.YELLOW;
        ctx.setLineDash([3, 1, 1, 1]);
      }
      
      ctx.lineWidth = GRAPH_CONFIG.RINGS.CIRCUIT_BREAKER_WIDTH / globalScale;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Main node
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#6b7280';
    ctx.fill();
    
    // Node border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();
    
    // Service type icon (simplified representation)
    const iconSize = nodeSize * GRAPH_CONFIG.NODE.ICON_SIZE_RATIO;
    ctx.fillStyle = CANVAS_CONSTANTS.COLORS.WHITE;
    ctx.textAlign = CANVAS_CONSTANTS.TEXT_ALIGN.CENTER;
    ctx.textBaseline = CANVAS_CONSTANTS.TEXT_BASELINE.MIDDLE;
    
    const iconChar = SERVICE_ICONS[(node.type || 'default') as keyof typeof SERVICE_ICONS] || '●';
    
    ctx.font = `${iconSize * GRAPH_CONFIG.NODE.ICON_FONT_MULTIPLIER}px ${CANVAS_CONSTANTS.FONTS.ARIAL}`;
    ctx.fillText(iconChar, node.x, node.y);
    
    // Label
    ctx.font = `${fontSize}px ${CANVAS_CONSTANTS.FONTS.JETBRAINS_MONO}`;
    ctx.textAlign = CANVAS_CONSTANTS.TEXT_ALIGN.CENTER;
    ctx.textBaseline = CANVAS_CONSTANTS.TEXT_BASELINE.TOP;
    
    // Background for label
    const textWidth = ctx.measureText(label || '').width;
    ctx.fillStyle = CANVAS_CONSTANTS.COLORS.TRANSPARENT_BLACK;
    ctx.fillRect(
      node.x - textWidth / 2 - GRAPH_CONFIG.NODE.LABEL_PADDING, 
      node.y + nodeSize + GRAPH_CONFIG.NODE.LABEL_PADDING, 
      textWidth + GRAPH_CONFIG.NODE.LABEL_PADDING * 2, 
      fontSize + GRAPH_CONFIG.NODE.LABEL_PADDING * 2
    );
    
    // Text
    ctx.fillStyle = CANVAS_CONSTANTS.COLORS.WHITE;
    ctx.fillText(label || '', node.x, node.y + nodeSize + GRAPH_CONFIG.NODE.LABEL_OFFSET);
    
    // Error rate indicator
    if (node.metrics && node.metrics.errorRate && node.metrics.errorRate > GRAPH_CONFIG.TRAFFIC.ERROR_THRESHOLD_HIGH) {
      ctx.beginPath();
      ctx.arc(
        node.x + nodeSize * GRAPH_CONFIG.NODE.ERROR_INDICATOR_OFFSET, 
        node.y - nodeSize * GRAPH_CONFIG.NODE.ERROR_INDICATOR_OFFSET, 
        GRAPH_CONFIG.NODE.ERROR_INDICATOR_SIZE, 
        0, 2 * Math.PI, false
      );
      ctx.fillStyle = CANVAS_CONSTANTS.COLORS.ERROR_RED;
      ctx.fill();
    }
  }, [selectedService, hoveredNode, showCriticalPath, criticalPath, showSinglePointsOfFailure, singlePointsOfFailure, showDependencyPaths, dependencyPaths, showLatencyHeatmap]);

  // Custom link rendering with animated traffic
  const linkCanvasObject = useCallback((link: ForceGraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source as ForceGraphNode;
    const end = link.target as ForceGraphNode;
    
    if (!start || !end || !start.x || !start.y || !end.x || !end.y) return;
    
    // Check if link is part of critical path or dependency path
    const isInCriticalPath = showCriticalPath && criticalPath.length > 1 && (() => {
      for (let i = 0; i < criticalPath.length - 1; i++) {
        if ((criticalPath[i] === start.id && criticalPath[i + 1] === end.id) ||
            (criticalPath[i] === end.id && criticalPath[i + 1] === start.id)) {
          return true;
        }
      }
      return false;
    })();
    
    const isInDependencyPath = showDependencyPaths && selectedService && dependencyPaths.some(path => {
      for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === start.id && path[i + 1] === end.id) ||
            (path[i] === end.id && path[i + 1] === start.id)) {
          return true;
        }
      }
      return false;
    });
    
    // Link color based on protocol, health, and dependency analysis
    let linkColor: string = CANVAS_CONSTANTS.COLORS.WHITE_30;
    let lineWidth = Math.max(link.value || 1, GRAPH_CONFIG.TRAFFIC.MIN_LINK_WIDTH) / globalScale;
    
    if (isInCriticalPath) {
      linkColor = BASE_COLORS.YELLOW + '80';
      lineWidth = Math.max(lineWidth * GRAPH_CONFIG.TRAFFIC.LINK_WIDTH_MULTIPLIER, 2 / globalScale);
    } else if (isInDependencyPath) {
      linkColor = BASE_COLORS.CYAN + '60';
      lineWidth = Math.max(lineWidth * GRAPH_CONFIG.TRAFFIC.DEPENDENCY_LINK_WIDTH_MULTIPLIER, 1.5 / globalScale);
    } else if ((link.errorRate || 0) > GRAPH_CONFIG.TRAFFIC.ERROR_THRESHOLD_HIGH) {
      linkColor = CANVAS_CONSTANTS.COLORS.ERROR_RED_60;
    } else if (link.mTLS) {
      linkColor = CANVAS_CONSTANTS.COLORS.MTLS_GREEN_60;
    } else if (link.encrypted) {
      linkColor = CANVAS_CONSTANTS.COLORS.ENCRYPTED_BLUE_60;
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
      const particleCount = Math.ceil((link.value || 1) / 2);
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
        if ((link.errorRate || 0) > GRAPH_CONFIG.TRAFFIC.ERROR_THRESHOLD_HIGH) {
          particleColor = TRAFFIC_COLORS.ERROR;
        } else if ((link.errorRate || 0) > GRAPH_CONFIG.TRAFFIC.ERROR_THRESHOLD_MEDIUM) {
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
    const arrowLength = GRAPH_CONFIG.ARROWS.LENGTH / globalScale;
    const arrowAngle = GRAPH_CONFIG.ARROWS.ANGLE;
    
    const nodeRadius = end.size || GRAPH_CONFIG.NODE.BASE_SIZE;
    const arrowX = end.x - Math.cos(angle) * (nodeRadius + GRAPH_CONFIG.ARROWS.OFFSET);
    const arrowY = end.y - Math.sin(angle) * (nodeRadius + GRAPH_CONFIG.ARROWS.OFFSET);
    
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
          graphRef.current.zoom(GRAPH_CONFIG.ANIMATION.AUTO_ROTATE_ZOOM, GRAPH_CONFIG.ANIMATION.AUTO_ROTATE_DURATION);
        }
      }, GRAPH_CONFIG.ANIMATION.AUTO_ROTATE_INTERVAL);
      
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
        onNodeHover={(node: ForceGraphNode | null) => setHoveredNode(node?.id || null)}
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