import type { NetworkMetrics, NetworkTrafficData, ProtocolBreakdown, TopTalker } from '@/types/network';

// Cache for consistent network data across re-renders
const networkDataCache = new Map<string, NetworkTrafficData>();

// Realistic pod names for top talkers
const podNames = [
  'nginx-deployment-7c79c4bf97-xk9mn',
  'api-gateway-5d9f8c8b4d-jh8zt',
  'redis-master-0', 
  'postgres-primary-0',
  'elasticsearch-0',
  'kafka-broker-1',
  'prometheus-server-6b7f9c8d5e-wr4kp',
  'grafana-5c8d7b9f4e-mp3vx',
  'ingress-nginx-controller-xyz',
  'cert-manager-webhook-abc'
];

// Generate network traffic data with realistic patterns
export const generateNetworkTrafficData = (duration: string = '1h'): NetworkTrafficData => {
  // Return cached data if available
  if (networkDataCache.has(duration)) {
    return networkDataCache.get(duration)!;
  }

  const now = Date.now();
  const intervals = duration === '15m' ? 15 : duration === '1h' ? 60 : duration === '6h' ? 360 : 1440; // minutes
  const points = Math.min(60, intervals);
  const intervalMs = (intervals * 60 * 1000) / points;

  const generateTrafficSeries = (baseValue: number, variance: number, trafficType: 'ingress' | 'egress', pattern?: string) => {
    return Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(now - (points - 1 - i) * intervalMs).toISOString();
      const progress = i / (points - 1);
      
      let value = baseValue;

      // Apply realistic network patterns
      switch (pattern) {
        case 'spike': // 15m - DDoS attack or sudden traffic spike
          if (trafficType === 'ingress') {
            value = baseValue + Math.sin(progress * Math.PI * 4) * variance * 2;
            if (progress > 0.6) value += baseValue * 3; // Major spike
          } else {
            value = baseValue + Math.sin(progress * Math.PI * 2) * variance * 0.8;
          }
          break;

        case 'gradual': // 1h - Normal business traffic growth
          if (trafficType === 'ingress') {
            value = baseValue + progress * variance * 1.5 + Math.sin(progress * Math.PI * 3) * variance * 0.5;
          } else {
            value = baseValue + progress * variance * 1.2 + Math.sin(progress * Math.PI * 2.5) * variance * 0.6;
          }
          break;

        case 'business': // 6h - Business hours pattern
          const hourOfDay = (progress * 6 + new Date().getHours() - 6) % 24;
          const isBusinessHours = hourOfDay >= 9 && hourOfDay <= 17;
          const multiplier = isBusinessHours ? (trafficType === 'ingress' ? 2.5 : 1.8) : 0.6;
          value = baseValue * multiplier + Math.sin(progress * Math.PI * 2) * variance;
          break;

        case 'daily': // 24h - Full daily cycle
          const dailyHour = (progress * 24) % 24;
          // Peak traffic during business hours, lower at night
          let dailyMultiplier = 0.3;
          if (dailyHour >= 8 && dailyHour <= 18) dailyMultiplier = 1.0;
          if (dailyHour >= 10 && dailyHour <= 16) dailyMultiplier = 1.5; // Peak hours
          
          value = baseValue * dailyMultiplier + 
                  Math.sin(progress * Math.PI * 2) * variance * 0.8 + 
                  Math.cos(progress * Math.PI * 4) * variance * 0.3;
          
          // Add lunch dip for ingress
          if (trafficType === 'ingress' && dailyHour >= 12 && dailyHour <= 13) {
            value *= 0.7;
          }
          break;

        default:
          value = baseValue + (Math.random() - 0.5) * variance;
      }

      // Add some realistic network variance and convert to bytes/second
      const networkNoise = (Math.random() - 0.5) * variance * 0.2;
      const finalValue = Math.max(0, (value + networkNoise) * 1024 * 1024); // Convert MB/s to bytes/s

      return {
        timestamp,
        value: Math.round(finalValue)
      };
    });
  };

  // Pattern selection based on timeframe
  const pattern = duration === '15m' ? 'spike' : duration === '1h' ? 'gradual' : duration === '6h' ? 'business' : 'daily';

  // Base traffic in MB/s
  const baseIngress = 45.8; // Higher ingress (incoming requests)
  const baseEgress = 32.4;  // Lower egress (responses)

  const ingressData = generateTrafficSeries(baseIngress, 15, 'ingress', pattern);
  const egressData = generateTrafficSeries(baseEgress, 12, 'egress', pattern);

  // Calculate total traffic
  const totalData = ingressData.map((point, index) => ({
    timestamp: point.timestamp,
    value: point.value + (egressData[index]?.value || 0)
  }));

  const trafficData = {
    ingress: ingressData,
    egress: egressData,
    total: totalData
  };

  // Cache the generated data
  networkDataCache.set(duration, trafficData);
  
  return trafficData;
};

// Generate protocol breakdown data
export const generateProtocolBreakdown = (): ProtocolBreakdown[] => {
  return [
    {
      protocol: 'HTTP/HTTPS',
      bytes: 2847291840, // ~2.65 GB
      percentage: 65.4,
      color: '#00FF00'
    },
    {
      protocol: 'gRPC',
      bytes: 847291840, // ~789 MB
      percentage: 19.5,
      color: '#00FFFF'
    },
    {
      protocol: 'TCP',
      bytes: 423645920, // ~394 MB  
      percentage: 9.7,
      color: '#FFFF00'
    },
    {
      protocol: 'UDP',
      bytes: 152387584, // ~145 MB
      percentage: 3.5,
      color: '#FF00FF'
    },
    {
      protocol: 'Other',
      bytes: 82387584, // ~78 MB
      percentage: 1.9,
      color: '#FF6600'
    }
  ];
};

// Generate top talkers data
export const generateTopTalkers = (): TopTalker[] => {
  return Array.from({ length: 10 }, (_, i) => {
    const baseTraffic = Math.pow(0.7, i) * 500; // Exponential decay
    const ingressBytes = Math.round((baseTraffic + Math.random() * 100) * 1024 * 1024); // MB to bytes
    const egressBytes = Math.round(ingressBytes * (0.6 + Math.random() * 0.4)); // Egress typically lower
    
    return {
      podName: podNames[i] || `unknown-pod-${i}`,
      namespace: i < 3 ? 'production' : i < 6 ? 'staging' : 'development',
      ingressBytes,
      egressBytes,
      totalBytes: ingressBytes + egressBytes,
      connections: Math.round(baseTraffic * (2 + Math.random())),
      rank: i + 1
    };
  }).sort((a, b) => b.totalBytes - a.totalBytes);
};

// Generate complete network metrics
export const generateNetworkMetrics = (duration: string = '1h'): NetworkMetrics => {
  const trafficData = generateNetworkTrafficData(duration);
  const protocolBreakdown = generateProtocolBreakdown();
  const topTalkers = generateTopTalkers();
  
  // Calculate bandwidth statistics from traffic data
  const currentIngress = trafficData.ingress[trafficData.ingress.length - 1]?.value || 0;
  const currentEgress = trafficData.egress[trafficData.egress.length - 1]?.value || 0;
  
  const peakIngress = Math.max(...trafficData.ingress.map(p => p.value));
  const peakEgress = Math.max(...trafficData.egress.map(p => p.value));
  
  const avgIngress = trafficData.ingress.reduce((sum, p) => sum + p.value, 0) / trafficData.ingress.length;
  const avgEgress = trafficData.egress.reduce((sum, p) => sum + p.value, 0) / trafficData.egress.length;

  return {
    trafficData,
    protocolBreakdown,
    topTalkers,
    totalBandwidth: {
      ingress: currentIngress,
      egress: currentEgress,
      peak: Math.max(peakIngress, peakEgress),
      average: (avgIngress + avgEgress) / 2
    },
    connectionCount: {
      active: Math.round(245 + Math.random() * 55), // 245-300 active connections
      established: Math.round(180 + Math.random() * 40), // 180-220 established
      timeWait: Math.round(15 + Math.random() * 10) // 15-25 in TIME_WAIT
    },
    lastUpdated: new Date().toISOString()
  };
};

export const mockNetworkMetrics = generateNetworkMetrics();