import { useEffect, type FC } from 'react';
import useDeploymentStore from '@stores/deploymentStore';
import RegistriesTab from './tabs/RegistriesTab';
import ImagesTab from './tabs/ImagesTab';
import DeploymentsTab from './tabs/DeploymentsTab';
import HistoryTab from './tabs/HistoryTab';
import { DeploymentsTab as DeploymentsTabEnum } from '@constants';

interface DeploymentDashboardProps {
  activeTab?: string;
  showDeployModal?: boolean;
  setShowDeployModal?: (show: boolean) => void;
  showAddRegistry?: boolean;
  setShowAddRegistry?: (show: boolean) => void;
  selectedDeployment?: string;
  setSelectedDeployment?: (deployment: string) => void;
}

const DeploymentDashboard: FC<DeploymentDashboardProps> = ({ 
  activeTab = DeploymentsTabEnum.DEPLOYMENTS, 
  showDeployModal, 
  setShowDeployModal,
  showAddRegistry,
  setShowAddRegistry,
  selectedDeployment,
  setSelectedDeployment
}) => {
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
        return <RegistriesTab showForm={showAddRegistry} setShowForm={setShowAddRegistry} />;
      case DeploymentsTabEnum.IMAGES:
        return <ImagesTab />;
      case DeploymentsTabEnum.DEPLOYMENTS:
        return (
          <DeploymentsTab 
            showDeployModal={showDeployModal} 
            setShowDeployModal={setShowDeployModal}
          />
        );
      case DeploymentsTabEnum.HISTORY:
        return <HistoryTab selectedDeployment={selectedDeployment} setSelectedDeployment={setSelectedDeployment} />;
      default:
        return <DeploymentsTab />;
    }
  };

  return (
    <div className="h-full overflow-hidden">
      {renderTabContent()}
    </div>
  );
};

export default DeploymentDashboard;