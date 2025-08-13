import { useEffect, type FC } from 'react';
import useDeploymentStore from '@/stores/deploymentStore';
import RegistriesTab from './tabs/RegistriesTab';
import ImagesTab from './tabs/ImagesTab';
import DeploymentsTab from './tabs/DeploymentsTab';
import HistoryTab from './tabs/HistoryTab';

type DeploymentTab = 'registries' | 'images' | 'deployments' | 'history';

interface DeploymentDashboardProps {
  activeTab?: DeploymentTab;
}

const DeploymentDashboard: FC<DeploymentDashboardProps> = ({ activeTab = 'deployments' }) => {
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
      case 'registries':
        return <RegistriesTab />;
      case 'images':
        return <ImagesTab />;
      case 'deployments':
        return <DeploymentsTab />;
      case 'history':
        return <HistoryTab />;
      default:
        return <DeploymentsTab />;
    }
  };

  return (
    <div>
      {renderTabContent()}
    </div>
  );
};

export default DeploymentDashboard;