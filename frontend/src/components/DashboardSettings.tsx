import { useState } from 'react';
import type { FC } from 'react';
import { X, RotateCcw, Eye, EyeOff, Monitor, Navigation } from 'lucide-react';
import useSettingsStore from '@stores/settingsStore';
import { 
  DASHBOARD_SECTIONS, 
  DASHBOARD_TABS, 
  DASHBOARD_SECTION_LABELS, 
  DASHBOARD_TAB_LABELS,
  UI_MESSAGES 
} from '@constants';

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSettings: FC<DashboardSettingsProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<'sections' | 'tabs'>('sections');
  const {
    dashboardConfig,
    toggleSection,
    toggleTab,
    resetToDefaults,
    isSectionVisible,
    isTabVisible,
  } = useSettingsStore();

  if (!isOpen) return null;

  const categories = [
    { id: 'sections' as const, label: 'Dashboard Sections', icon: Monitor },
    { id: 'tabs' as const, label: 'Navigation Tabs', icon: Navigation },
  ];

  const handleToggleSection = (sectionId: string) => {
    toggleSection(sectionId);
  };

  const handleToggleTab = (tabId: string) => {
    toggleTab(tabId);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all dashboard settings to default values?')) {
      resetToDefaults();
    }
  };

  const sectionEntries = Object.entries(DASHBOARD_SECTIONS);
  const tabEntries = Object.entries(DASHBOARD_TABS);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-black border border-white max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-mono font-bold">SYSTEM CONFIGURATION</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[60vh]">
          {/* Sidebar */}
          <div className="w-64 border-r border-white flex flex-col">
            <div className="p-4 flex-1">
              <h3 className="text-sm font-mono opacity-60 mb-4">CATEGORIES</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 font-mono text-sm transition-colors text-left ${
                      activeCategory === category.id
                        ? 'bg-white text-black'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <category.icon size={16} />
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <div className="p-4 border-t border-white/20">
              <button
                onClick={handleReset}
                className="w-full flex items-center space-x-2 px-3 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
              >
                <RotateCcw size={16} />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeCategory === 'sections' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-mono mb-2">Interface Sections</h3>
                    <p className="text-sm font-mono opacity-60">
                      Control which UI sections are visible in the interface.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {sectionEntries.map(([key, sectionId]) => {
                      const isVisible = isSectionVisible(sectionId);
                      return (
                        <div
                          key={sectionId}
                          className="flex items-center justify-between p-3 border border-white/20 hover:border-white/40 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {isVisible ? (
                              <Eye size={16} className="text-green-400" />
                            ) : (
                              <EyeOff size={16} className="text-red-400" />
                            )}
                            <div>
                              <div className="font-mono text-sm">
                                {DASHBOARD_SECTION_LABELS[sectionId]}
                              </div>
                              <div className="text-xs font-mono opacity-60">
                                {sectionId}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleSection(sectionId)}
                            className={`px-3 py-1 border font-mono text-xs transition-colors ${
                              isVisible
                                ? 'border-green-400 text-green-400 hover:bg-green-400 hover:text-black'
                                : 'border-red-400 text-red-400 hover:bg-red-400 hover:text-black'
                            }`}
                          >
                            {isVisible ? 'VISIBLE' : 'HIDDEN'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeCategory === 'tabs' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-mono mb-2">Navigation Tabs</h3>
                    <p className="text-sm font-mono opacity-60">
                      Control which main navigation tabs are available. At least one tab must remain enabled.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {tabEntries.map(([key, tabId]) => {
                      const isVisible = isTabVisible(tabId);
                      const visibleTabsCount = Object.values(dashboardConfig.tabs).filter(Boolean).length;
                      const canDisable = visibleTabsCount > 1;
                      
                      return (
                        <div
                          key={tabId}
                          className="flex items-center justify-between p-3 border border-white/20 hover:border-white/40 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            {isVisible ? (
                              <Eye size={16} className="text-green-400" />
                            ) : (
                              <EyeOff size={16} className="text-red-400" />
                            )}
                            <div>
                              <div className="font-mono text-sm">
                                {DASHBOARD_TAB_LABELS[tabId]}
                              </div>
                              <div className="text-xs font-mono opacity-60">
                                {tabId}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleTab(tabId)}
                            disabled={isVisible && !canDisable}
                            className={`px-3 py-1 border font-mono text-xs transition-colors ${
                              isVisible && !canDisable
                                ? 'border-gray-500 text-gray-500 cursor-not-allowed'
                                : isVisible
                                ? 'border-green-400 text-green-400 hover:bg-green-400 hover:text-black'
                                : 'border-red-400 text-red-400 hover:bg-red-400 hover:text-black'
                            }`}
                          >
                            {isVisible ? 'ENABLED' : 'DISABLED'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {Object.values(dashboardConfig.tabs).filter(Boolean).length === 1 && (
                    <div className="mt-4 p-3 border border-yellow-400 bg-yellow-400/10">
                      <p className="text-sm font-mono text-yellow-400">
                        At least one navigation tab must remain enabled.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white p-4 flex justify-between items-center">
          <div className="text-xs font-mono opacity-60">
            Configuration saved locally
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;