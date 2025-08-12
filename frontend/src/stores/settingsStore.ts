import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_DASHBOARD_CONFIG } from '@constants';

export interface DashboardConfig {
  sections: Record<string, boolean>;
  tabs: Record<string, boolean>;
}

interface SettingsStore {
  dashboardConfig: DashboardConfig;
  
  // Actions
  toggleSection: (sectionId: string) => void;
  toggleTab: (tabId: string) => void;
  resetToDefaults: () => void;
  
  // Getters
  isSectionVisible: (sectionId: string) => boolean;
  isTabVisible: (tabId: string) => boolean;
  getVisibleTabs: () => string[];
}

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
      
      toggleSection: (sectionId: string) => 
        set((state) => ({
          dashboardConfig: {
            ...state.dashboardConfig,
            sections: {
              ...state.dashboardConfig.sections,
              [sectionId]: !state.dashboardConfig.sections[sectionId],
            },
          },
        })),
      
      toggleTab: (tabId: string) => 
        set((state) => ({
          dashboardConfig: {
            ...state.dashboardConfig,
            tabs: {
              ...state.dashboardConfig.tabs,
              [tabId]: !state.dashboardConfig.tabs[tabId],
            },
          },
        })),
      
      resetToDefaults: () => 
        set(() => ({
          dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
        })),
      
      isSectionVisible: (sectionId: string) => 
        get().dashboardConfig.sections[sectionId] ?? true,
      
      isTabVisible: (tabId: string) => 
        get().dashboardConfig.tabs[tabId] ?? true,
      
      getVisibleTabs: () => 
        Object.entries(get().dashboardConfig.tabs)
          .filter(([_, visible]) => visible)
          .map(([tabId, _]) => tabId),
    }),
    {
      name: 'denshimon-settings',
      version: 1,
    }
  )
);

export default useSettingsStore;