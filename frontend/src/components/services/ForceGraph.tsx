import { useEffect, useRef, useState, useCallback, FC } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ServiceNode, ServiceConnection } from '@/types/serviceMesh';
import { 
  CircuitBreakerStatus, 
  NetworkProtocol, 
  ServiceType, 
  SERVICE_TYPE_COLORS, 
  TRAFFIC_COLORS, 
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
  isLive = false
}) => {
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [animationFrame, setAnimationFrame] = useState(0);

  // Calculate node size based on request rate
  const getNodeSize = (service: ServiceNode): number => {
    const { BASE_SIZE, SCALE_FACTOR } = GRAPH_CONFIG.NODE;
    return BASE_SIZE + Math.log10(service.metrics.requestRate + 1) * SCALE_FACTOR;
  };

  // Get node color based on service type and status
  const getNodeColor = (service: ServiceNode): string => {
    if (service.circuitBreaker.status === CircuitBreakerStatus.OPEN) {
      return BASE_COLORS.RED;
    }
    
    switch (service.status) {
      case 'error':
        return BASE_COLORS.RED;
      case 'warning':
        return BASE_COLORS.YELLOW;
      case 'healthy':
        return SERVICE_TYPE_COLORS[service.type as ServiceType] || BASE_COLORS.GRAY;
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
    const nodeSize = isSelected ? node.size * 1.5 : node.size;
    
    // Outer ring for selection/hover
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 3, 0, 2 * Math.PI, false);
      ctx.strokeStyle = isSelected ? '#ffffff' : '#ffffff80';
      ctx.lineWidth = isSelected ? 2 / globalScale : 1 / globalScale;
      ctx.stroke();
    }
    
    // Circuit breaker indicator
    if (node.circuitBreaker === CircuitBreakerStatus.OPEN) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 6, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2 / globalScale;
      ctx.setLineDash([3, 3]);
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
    
    const iconChar = SERVICE_ICONS[node.type as ServiceType] || '●';
    
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
      ctx.arc(node.x + nodeSize * 0.7, node.y - nodeSize * 0.7, 3, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  }, [selectedService, hoveredNode]);

  // Custom link rendering with animated traffic
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    
    if (!start || !end || !start.x || !start.y || !end.x || !end.y) return;
    
    // Link color based on protocol and health
    let linkColor = '#ffffff30';
    if (link.errorRate > 5) {
      linkColor = '#ef444460';
    } else if (link.mTLS) {
      linkColor = '#10b98160';
    } else if (link.encrypted) {
      linkColor = '#3b82f660';
    }
    
    // Draw link
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = Math.max(link.value, 0.5) / globalScale;
    
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
        
        let particleColor = TRAFFIC_COLORS.HEALTHY;
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
  }, [isLive, animationFrame]);

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
        chargeStrength={GRAPH_CONFIG.PHYSICS.CHARGE_STRENGTH}
        linkDistance={GRAPH_CONFIG.PHYSICS.LINK_DISTANCE}
      />
    </div>
  );
};

export default ForceGraph;