import React, { useState, useEffect, useMemo } from 'react';
import { TimeRange } from '@constants';
import { parseTimeRangeToHours } from '@utils/timeUtils';
import { AlertTriangle, AlertCircle, Info, CheckCircle, TrendingUp, TrendingDown, Minus, Activity, Server, Package, Shield, Network, HardDrive, Settings } from 'lucide-react';
import { EventTimelineData, TimelineEvent, EventSeverity, EventCategory } from '@/types/eventTimeline';
import { generateEventTimelineData } from '@/mocks/events/timeline';

interface EventTimelineProps {
  timeRange?: string;
}

const EventTimeline: React.FC<EventTimelineProps> = ({ timeRange = TimeRange.TWENTY_FOUR_HOURS }) => {
  const [data, setData] = useState<EventTimelineData | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<EventSeverity[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const hours = parseTimeRangeToHours(timeRange);
    const timelineData = generateEventTimelineData(hours);
    setData(timelineData);
  }, [timeRange]);

  const filteredData = useMemo(() => {
    if (!data) return null;

    const filteredEvents = data.events.filter(event => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category);
      const matchesSeverity = selectedSeverities.length === 0 || selectedSeverities.includes(event.severity);
      const matchesSearch = searchQuery === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSeverity && matchesSearch;
    });

    // Regroup filtered events
    const groupMap = new Map<string, TimelineEvent[]>();
    filteredEvents.forEach(event => {
      const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      if (!groupMap.has(hour)) {
        groupMap.set(hour, []);
      }
      groupMap.get(hour)!.push(event);
    });

    const groups = Array.from(groupMap.entries()).map(([hour, events]) => ({
      hour,
      events,
      summary: {
        critical: events.filter(e => e.severity === 'critical').length,
        warning: events.filter(e => e.severity === 'warning').length,
        info: events.filter(e => e.severity === 'info').length,
        success: events.filter(e => e.severity === 'success').length,
      },
    })).sort((a, b) => new Date(b.hour).getTime() - new Date(a.hour).getTime());

    return {
      ...data,
      events: filteredEvents,
      groups,
    };
  }, [data, selectedCategories, selectedSeverities, searchQuery]);

  const getSeverityIcon = (severity: EventSeverity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'node': return <Server className="w-4 h-4" />;
      case 'pod': return <Package className="w-4 h-4" />;
      case 'service': return <Activity className="w-4 h-4" />;
      case 'config': return <Settings className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'network': return <Network className="w-4 h-4" />;
      case 'storage': return <HardDrive className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: EventSeverity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 text-red-500';
      case 'warning': return 'border-yellow-500 text-yellow-500';
      case 'info': return 'border-blue-500 text-blue-500';
      case 'success': return 'border-green-500 text-green-500';
    }
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const toggleGroup = (hour: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(hour)) {
      newExpanded.delete(hour);
    } else {
      newExpanded.add(hour);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleCategory = (category: EventCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleSeverity = (severity: EventSeverity) => {
    if (selectedSeverities.includes(severity)) {
      setSelectedSeverities(selectedSeverities.filter(s => s !== severity));
    } else {
      setSelectedSeverities([...selectedSeverities, severity]);
    }
  };

  if (!filteredData) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading timeline...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Total Events</div>
          <div className="text-2xl font-mono">{filteredData.statistics.total}</div>
        </div>
        <div className="bg-black border border-red-500 p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Critical</div>
          <div className="text-2xl font-mono text-red-500">{filteredData.statistics.bySeverity.critical}</div>
        </div>
        <div className="bg-black border border-yellow-500 p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Warnings</div>
          <div className="text-2xl font-mono text-yellow-500">{filteredData.statistics.bySeverity.warning}</div>
        </div>
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Unresolved</div>
          <div className="text-2xl font-mono text-red-500">{filteredData.statistics.unresolvedCritical}</div>
        </div>
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Avg Resolution</div>
          <div className="text-2xl font-mono">{filteredData.statistics.averageResolutionTime}m</div>
        </div>
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Trend</div>
          <div className="flex items-center gap-2">
            {getTrendIcon(filteredData.statistics.recentTrend)}
            <span className="text-sm font-mono">{filteredData.statistics.recentTrend.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-black border border-white px-3 py-2 font-mono text-sm"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-mono text-gray-500">SEVERITY:</span>
            {(['critical', 'warning', 'info', 'success'] as EventSeverity[]).map(severity => (
              <button
                key={severity}
                onClick={() => toggleSeverity(severity)}
                className={`px-2 py-1 font-mono text-xs border transition-colors ${
                  selectedSeverities.includes(severity) || selectedSeverities.length === 0
                    ? getSeverityColor(severity)
                    : 'border-gray-600 text-gray-600'
                }`}
              >
                {severity.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-xs font-mono text-gray-500">CATEGORY:</span>
            {(['node', 'pod', 'service', 'config', 'security', 'network', 'storage'] as EventCategory[]).map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-2 py-1 font-mono text-xs border transition-colors ${
                  selectedCategories.includes(category) || selectedCategories.length === 0
                    ? 'border-white text-white'
                    : 'border-gray-600 text-gray-600'
                }`}
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-white p-4 max-h-[600px] overflow-y-auto">
        {filteredData.groups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-lg font-mono mb-2">NO EVENTS FOUND</div>
            <div className="text-sm font-mono text-gray-500">
              No events match your current filters
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.groups.map((group) => (
              <div key={group.hour} className="border-l-2 border-white pl-4 relative">
                {/* Timeline dot */}
                <div className="absolute -left-2 top-0 w-3 h-3 bg-white border-2 border-black rounded-full" />
                
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.hour)}
                  className="w-full text-left hover:bg-white/5 transition-colors p-2 -ml-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-gray-500">
                        {new Date(group.hour).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        {group.summary.critical > 0 && (
                          <span className="text-xs font-mono text-red-500">
                            {group.summary.critical} CRITICAL
                          </span>
                        )}
                        {group.summary.warning > 0 && (
                          <span className="text-xs font-mono text-yellow-500">
                            {group.summary.warning} WARNING
                          </span>
                        )}
                        {group.summary.info > 0 && (
                          <span className="text-xs font-mono text-blue-500">
                            {group.summary.info} INFO
                          </span>
                        )}
                        {group.summary.success > 0 && (
                          <span className="text-xs font-mono text-green-500">
                            {group.summary.success} SUCCESS
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono">
                      {expandedGroups.has(group.hour) ? '▼' : '▶'}
                    </span>
                  </div>
                </button>
                
                {/* Events */}
                {expandedGroups.has(group.hour) && (
                  <div className="mt-2 space-y-2">
                    {group.events.map((event) => (
                      <div
                        key={event.id}
                        className={`border ${getSeverityColor(event.severity).split(' ')[0]} p-3 bg-black`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(event.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-mono text-sm font-bold">{event.title}</span>
                                <div className="flex items-center gap-2">
                                  {getCategoryIcon(event.category)}
                                  <span className="text-xs font-mono text-gray-500">
                                    {event.category.toUpperCase()}
                                  </span>
                                </div>
                                {event.source.namespace && (
                                  <span className="text-xs font-mono text-gray-500">
                                    {event.source.namespace}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-mono text-gray-300">{event.description}</p>
                              {event.impact && (
                                <div className="mt-2 text-xs font-mono text-gray-500">
                                  Impact: {event.impact.affected}/{event.impact.total} {event.impact.unit} affected
                                </div>
                              )}
                              {event.duration && (
                                <div className="mt-1 text-xs font-mono">
                                  {event.resolved ? (
                                    <span className="text-green-500">
                                      Resolved in {Math.floor(event.duration / 60000)} minutes
                                    </span>
                                  ) : (
                                    <span className="text-yellow-500">
                                      Ongoing for {Math.floor(event.duration / 60000)} minutes
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-mono text-gray-500">
                            {formatTimeAgo(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTimeline;