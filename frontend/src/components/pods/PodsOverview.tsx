import { useState } from 'react';
import type { FC } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import PodMetrics from '@components/metrics/PodMetrics';
import PodLifecycle from '@components/pods/PodLifecycle';

const PodsOverview: FC = () => {
  const [activeView, setActiveView] = useState('metrics');

  const views = [
    { id: 'metrics', label: 'Metrics', icon: Database, description: 'Current workload resource usage and deployment efficiency' },
    { id: 'lifecycle', label: 'Health & Restarts', icon: RefreshCw, description: 'Workload stability, restart patterns, and failure analysis for deployment planning' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-mono mb-2">WORKLOAD STATUS</h2>
          <p className="text-sm font-mono opacity-60">
            {views.find(v => v.id === activeView)?.description || 'Monitor workload health and performance'}
          </p>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex space-x-0 border border-white">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex items-center space-x-2 px-6 py-3 border-r border-white last:border-r-0 font-mono transition-colors ${
              activeView === view.id
                ? 'bg-white text-black'
                : 'bg-black text-white hover:bg-white hover:text-black'
            }`}
          >
            <view.icon size={16} />
            <span>{view.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeView === 'metrics' && <PodMetrics />}
        {activeView === 'lifecycle' && <PodLifecycle />}
      </div>
    </div>
  );
};

export default PodsOverview;