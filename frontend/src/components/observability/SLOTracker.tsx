import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

export interface SLI {
  name: string;
  value: number;
  unit: string;
  target: number;
  description: string;
  period: '24h' | '7d' | '30d';
}

export interface SLO {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  errorBudget: {
    total: number;
    consumed: number;
    remaining: number;
  };
  slis: SLI[];
  status: 'met' | 'at-risk' | 'breached';
  trend: 'improving' | 'degrading' | 'stable';
}

interface SLOTrackerProps {
  timeRange?: '24h' | '7d' | '30d';
  showDetails?: boolean;
}

const SLOTracker: FC<SLOTrackerProps> = ({ 
  timeRange = '30d',
  showDetails = true 
}) => {
  const [slos, setSLOs] = useState<SLO[]>([]);
  const [selectedSLO, setSelectedSLO] = useState<SLO | null>(null);

  // Generate mock SLO data
  const generateSLOs = (): SLO[] => {
    return [
      {
        id: 'availability',
        name: 'Service Availability',
        description: 'Overall service availability across all regions',
        target: 99.9,
        current: 99.92,
        errorBudget: {
          total: 43.2, // minutes per month
          consumed: 3.5,
          remaining: 39.7,
        },
        slis: [
          {
            name: 'Uptime',
            value: 99.95,
            unit: '%',
            target: 99.9,
            description: 'Service uptime percentage',
            period: timeRange,
          },
          {
            name: 'Success Rate',
            value: 99.87,
            unit: '%',
            target: 99.5,
            description: 'Successful request percentage',
            period: timeRange,
          },
        ],
        status: 'met',
        trend: 'stable',
      },
      {
        id: 'latency',
        name: 'Response Time',
        description: 'API response time performance',
        target: 95,
        current: 93.5,
        errorBudget: {
          total: 2160, // minutes per month
          consumed: 1400,
          remaining: 760,
        },
        slis: [
          {
            name: 'P50 Latency',
            value: 45,
            unit: 'ms',
            target: 50,
            description: 'Median response time',
            period: timeRange,
          },
          {
            name: 'P95 Latency',
            value: 250,
            unit: 'ms',
            target: 200,
            description: '95th percentile response time',
            period: timeRange,
          },
          {
            name: 'P99 Latency',
            value: 850,
            unit: 'ms',
            target: 1000,
            description: '99th percentile response time',
            period: timeRange,
          },
        ],
        status: 'at-risk',
        trend: 'degrading',
      },
      {
        id: 'error-rate',
        name: 'Error Rate',
        description: 'Percentage of requests resulting in errors',
        target: 99,
        current: 98.2,
        errorBudget: {
          total: 432, // minutes per month
          consumed: 380,
          remaining: 52,
        },
        slis: [
          {
            name: '4xx Errors',
            value: 0.8,
            unit: '%',
            target: 1,
            description: 'Client error rate',
            period: timeRange,
          },
          {
            name: '5xx Errors',
            value: 1.0,
            unit: '%',
            target: 0.5,
            description: 'Server error rate',
            period: timeRange,
          },
        ],
        status: 'at-risk',
        trend: 'improving',
      },
      {
        id: 'throughput',
        name: 'Request Throughput',
        description: 'System request processing capacity',
        target: 95,
        current: 97.5,
        errorBudget: {
          total: 2160,
          consumed: 500,
          remaining: 1660,
        },
        slis: [
          {
            name: 'Requests/sec',
            value: 1250,
            unit: 'rps',
            target: 1000,
            description: 'Average requests per second',
            period: timeRange,
          },
          {
            name: 'Queue Depth',
            value: 15,
            unit: '',
            target: 50,
            description: 'Average queue depth',
            period: timeRange,
          },
        ],
        status: 'met',
        trend: 'improving',
      },
    ];
  };

  useEffect(() => {
    setSLOs(generateSLOs());
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'met':
        return 'text-green-500 border-green-500';
      case 'at-risk':
        return 'text-yellow-500 border-yellow-500';
      case 'breached':
        return 'text-red-500 border-red-500';
      default:
        return 'text-gray-500 border-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={14} className="text-green-500" />;
      case 'degrading':
        return <TrendingDown size={14} className="text-red-500" />;
      default:
        return <div className="w-3.5 h-3.5 border-b border-gray-500" />;
    }
  };

  const getErrorBudgetStatus = (consumed: number, total: number) => {
    const percentage = (consumed / total) * 100;
    if (percentage < 50) return 'healthy';
    if (percentage < 80) return 'warning';
    return 'critical';
  };

  return (
    <div className="space-y-6">
      {/* SLO Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {slos.map((slo) => (
          <div
            key={slo.id}
            onClick={() => setSelectedSLO(slo.id === selectedSLO?.id ? null : slo)}
            className={`border ${getStatusColor(slo.status)} p-4 cursor-pointer transition-all hover:bg-white/5 ${
              selectedSLO?.id === slo.id ? 'bg-white/10' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Target size={16} className={getStatusColor(slo.status).split(' ')[0]} />
              {getTrendIcon(slo.trend)}
            </div>
            
            <h3 className="font-mono text-sm font-bold mb-1">{slo.name}</h3>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-mono font-bold">
                {slo.current.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-gray-500">
                TARGET: {slo.target}%
              </span>
            </div>

            {/* Error Budget Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">ERROR BUDGET</span>
                <span>{slo.errorBudget.remaining.toFixed(0)} min</span>
              </div>
              <div className="w-full bg-gray-800 h-2">
                <div
                  className={`h-full transition-all ${
                    getErrorBudgetStatus(slo.errorBudget.consumed, slo.errorBudget.total) === 'healthy'
                      ? 'bg-green-500'
                      : getErrorBudgetStatus(slo.errorBudget.consumed, slo.errorBudget.total) === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${((slo.errorBudget.total - slo.errorBudget.consumed) / slo.errorBudget.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className={`text-xs font-mono mt-2 ${getStatusColor(slo.status).split(' ')[0]}`}>
              {slo.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Selected SLO Details */}
      {selectedSLO && showDetails && (
        <div className="border border-white bg-black">
          <div className="border-b border-white/20 px-4 py-2 flex items-center justify-between">
            <h3 className="font-mono text-sm font-bold">{selectedSLO.name.toUpperCase()} - SLI BREAKDOWN</h3>
            <button
              onClick={() => setSelectedSLO(null)}
              className="text-xs font-mono hover:text-gray-400"
            >
              CLOSE
            </button>
          </div>

          <div className="p-4">
            <p className="text-sm font-mono text-gray-400 mb-4">{selectedSLO.description}</p>

            {/* SLI Table */}
            <div className="border border-white/20 overflow-hidden">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3">SLI</th>
                    <th className="text-right p-3">VALUE</th>
                    <th className="text-right p-3">TARGET</th>
                    <th className="text-center p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSLO.slis.map((sli, index) => {
                    const isMet = sli.unit === '%' 
                      ? sli.value >= sli.target 
                      : sli.unit === 'ms' 
                      ? sli.value <= sli.target
                      : sli.value >= sli.target;

                    return (
                      <tr key={index} className="border-b border-white/10">
                        <td className="p-3">
                          <div>
                            <div className="font-bold">{sli.name}</div>
                            <div className="text-xs text-gray-500">{sli.description}</div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {sli.value}{sli.unit}
                        </td>
                        <td className="p-3 text-right text-gray-500">
                          {sli.target}{sli.unit}
                        </td>
                        <td className="p-3 text-center">
                          {isMet ? (
                            <CheckCircle size={16} className="text-green-500 inline" />
                          ) : (
                            <AlertTriangle size={16} className="text-yellow-500 inline" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Error Budget Details */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="border border-white/20 p-3">
                <div className="text-gray-500 mb-1">TOTAL BUDGET</div>
                <div className="text-lg">{selectedSLO.errorBudget.total} min</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-gray-500 mb-1">CONSUMED</div>
                <div className="text-lg text-yellow-500">{selectedSLO.errorBudget.consumed} min</div>
              </div>
              <div className="border border-white/20 p-3">
                <div className="text-gray-500 mb-1">REMAINING</div>
                <div className="text-lg text-green-500">{selectedSLO.errorBudget.remaining} min</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Burn Rate Alert */}
      {slos.some(slo => slo.errorBudget.consumed / slo.errorBudget.total > 0.8) && (
        <div className="border border-yellow-500 bg-yellow-500/10 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            <h3 className="font-mono text-sm font-bold text-yellow-500">HIGH ERROR BUDGET BURN RATE</h3>
          </div>
          <div className="text-xs font-mono text-yellow-400">
            One or more SLOs are consuming error budget faster than expected. Review and take corrective action.
          </div>
        </div>
      )}
    </div>
  );
};

export default SLOTracker;