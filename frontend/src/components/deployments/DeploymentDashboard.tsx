import { useEffect, type FC } from 'react';
import useDeploymentStore from '@/stores/deploymentStore';
import RegistriesTab from './tabs/RegistriesTab';
import ImagesTab from './tabs/ImagesTab';
import EnhancedDeploymentsTab from './tabs/EnhancedDeploymentsTab';
import HistoryTab from './tabs/HistoryTab';
import { DeploymentsTab as DeploymentsTabEnum } from '@/constants';

interface DeploymentDashboardProps {
  activeTab?: string;
}

const DeploymentDashboard: FC<DeploymentDashboardProps> = ({ activeTab = DeploymentsTabEnum.DEPLOYMENTS }) => {
  const { fetchRegistries, fetchDeployments, fetchNodes } = useDeploymentStore();

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchRegistries(),
          fetchDeployments(),
          fetchNodes(),
        ]);
      } catch (error) {
        console.error('Failed to initialize deployment data:', error);
      }
    };

    initializeData();
  }, [fetchRegistries, fetchDeployments, fetchNodes]);

  // Tabs are now controlled by parent Dashboard component

  const renderTabContent = () => {
    switch (activeTab) {
      case DeploymentsTabEnum.REGISTRIES:
        return <RegistriesTab />;
      case DeploymentsTabEnum.IMAGES:
        return <ImagesTab />;
      case DeploymentsTabEnum.DEPLOYMENTS:
        return <EnhancedDeploymentsTab />;
      case DeploymentsTabEnum.HISTORY:
        return <HistoryTab />;
      default:
        return <EnhancedDeploymentsTab />;
    }
  };

  return (
    <div>
      {renderTabContent()}
    </div>
  );
};

export default DeploymentDashboard;