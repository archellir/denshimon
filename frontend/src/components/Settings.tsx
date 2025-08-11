import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Save, RefreshCw, Database, Shield, Monitor, Bell, User, Key } from 'lucide-react';
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore';

interface SettingsData {
  // Metrics settings
  refreshInterval: number;
  autoRefresh: boolean;
  historyDuration: string;
  
  // Authentication settings
  tokenDuration: number;
  sessionTimeout: number;
  
  // Monitoring settings
  alertThresholds: {
    cpu: number;
    memory: number;
    storage: number;
  };
  
  // System settings
  logLevel: string;
  auditLogging: boolean;
  darkMode: boolean; // For future use
}

const Settings: FC = () => {
  const { refreshInterval, autoRefresh, setRefreshInterval, setAutoRefresh } = useWebSocketMetricsStore();
  
  const [settings, setSettings] = useState<SettingsData>({
    refreshInterval: refreshInterval,
    autoRefresh: autoRefresh,
    historyDuration: '1h',
    tokenDuration: 24,
    sessionTimeout: 60,
    alertThresholds: {
      cpu: 80,
      memory: 80,
      storage: 85,
    },
    logLevel: 'info',
    auditLogging: true,
    darkMode: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    // Load settings from localStorage or API
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('denshimon_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    
    try {
      // Save to localStorage (in production, would save to backend API)
      localStorage.setItem('denshimon_settings', JSON.stringify(settings));
      
      // Update metrics store with new values
      setRefreshInterval(settings.refreshInterval);
      setAutoRefresh(settings.autoRefresh);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings: SettingsData = {
        refreshInterval: 30000,
        autoRefresh: true,
        historyDuration: '1h',
        tokenDuration: 24,
        sessionTimeout: 60,
        alertThresholds: {
          cpu: 80,
          memory: 80,
          storage: 85,
        },
        logLevel: 'info',
        auditLogging: true,
        darkMode: true,
      };
      setSettings(defaultSettings);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateAlertThreshold = (resource: 'cpu' | 'memory' | 'storage', value: number) => {
    setSettings(prev => ({
      ...prev,
      alertThresholds: {
        ...prev.alertThresholds,
        [resource]: value,
      },
    }));
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'SAVING...';
      case 'saved': return 'SAVED!';
      case 'error': return 'ERROR';
      default: return 'SAVE SETTINGS';
    }
  };

  const getSaveButtonColor = () => {
    switch (saveStatus) {
      case 'saved': return 'text-green-400 border-green-400';
      case 'error': return 'text-red-400 border-red-400';
      default: return 'text-white border-white hover:bg-white hover:text-black';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mono">SYSTEM SETTINGS</h1>
        <div className="flex space-x-4">
          <button
            onClick={resetSettings}
            className="flex items-center space-x-2 px-4 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono"
          >
            <RefreshCw size={16} />
            <span>RESET</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 border transition-colors font-mono ${getSaveButtonColor()}`}
          >
            <Save size={16} />
            <span>{getSaveButtonText()}</span>
          </button>
        </div>
      </div>

      {/* Metrics Settings */}
      <div className="border border-white">
        <div className="border-b border-white p-4">
          <h2 className="flex items-center space-x-2 text-lg font-mono">
            <Monitor size={18} />
            <span>METRICS & MONITORING</span>
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-mono mb-2">REFRESH INTERVAL (MS)</label>
              <input
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value))}
                min="5000"
                max="300000"
                step="5000"
                className="w-full bg-black border border-white p-2 font-mono focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-mono mb-2">HISTORY DURATION</label>
              <select
                value={settings.historyDuration}
                onChange={(e) => updateSetting('historyDuration', e.target.value)}
                className="w-full bg-black border border-white p-2 font-mono focus:outline-none focus:border-green-400"
              >
                <option value="15m">15 MINUTES</option>
                <option value="1h">1 HOUR</option>
                <option value="6h">6 HOURS</option>
                <option value="24h">24 HOURS</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={settings.autoRefresh}
              onChange={(e) => updateSetting('autoRefresh', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="auto-refresh" className="font-mono text-sm">
              ENABLE AUTO-REFRESH
            </label>
          </div>

          {/* Alert Thresholds */}
          <div>
            <h3 className="font-mono text-sm mb-3">ALERT THRESHOLDS (%)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['cpu', 'memory', 'storage'] as const).map((resource) => (
                <div key={resource}>
                  <label className="block text-xs font-mono mb-1">
                    {resource.toUpperCase()} THRESHOLD
                  </label>
                  <input
                    type="number"
                    value={settings.alertThresholds[resource]}
                    onChange={(e) => updateAlertThreshold(resource, parseInt(e.target.value))}
                    min="50"
                    max="95"
                    step="5"
                    className="w-full bg-black border border-white p-2 font-mono text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Settings */}
      <div className="border border-white">
        <div className="border-b border-white p-4">
          <h2 className="flex items-center space-x-2 text-lg font-mono">
            <Shield size={18} />
            <span>AUTHENTICATION & SECURITY</span>
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-mono mb-2">TOKEN DURATION (HOURS)</label>
              <input
                type="number"
                value={settings.tokenDuration}
                onChange={(e) => updateSetting('tokenDuration', parseInt(e.target.value))}
                min="1"
                max="168"
                step="1"
                className="w-full bg-black border border-white p-2 font-mono focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-mono mb-2">SESSION TIMEOUT (MIN)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="480"
                step="5"
                className="w-full bg-black border border-white p-2 font-mono focus:outline-none focus:border-green-400"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="audit-logging"
              checked={settings.auditLogging}
              onChange={(e) => updateSetting('auditLogging', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="audit-logging" className="font-mono text-sm">
              ENABLE AUDIT LOGGING
            </label>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="border border-white">
        <div className="border-b border-white p-4">
          <h2 className="flex items-center space-x-2 text-lg font-mono">
            <Database size={18} />
            <span>SYSTEM CONFIGURATION</span>
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-mono mb-2">LOG LEVEL</label>
            <select
              value={settings.logLevel}
              onChange={(e) => updateSetting('logLevel', e.target.value)}
              className="w-full md:w-1/2 bg-black border border-white p-2 font-mono focus:outline-none focus:border-green-400"
            >
              <option value="debug">DEBUG</option>
              <option value="info">INFO</option>
              <option value="warn">WARN</option>
              <option value="error">ERROR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="border border-white">
        <div className="border-b border-white p-4">
          <h2 className="flex items-center space-x-2 text-lg font-mono">
            <Bell size={18} />
            <span>SYSTEM STATUS</span>
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
            <div className="flex justify-between">
              <span>REFRESH INTERVAL:</span>
              <span className="text-green-400">{settings.refreshInterval / 1000}s</span>
            </div>
            <div className="flex justify-between">
              <span>AUTO-REFRESH:</span>
              <span className={settings.autoRefresh ? 'text-green-400' : 'text-red-400'}>
                {settings.autoRefresh ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>AUDIT LOGGING:</span>
              <span className={settings.auditLogging ? 'text-green-400' : 'text-red-400'}>
                {settings.auditLogging ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;