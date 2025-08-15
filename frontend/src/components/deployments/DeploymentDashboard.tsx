import { useEffect, type FC } from 'react';
import useDeploymentStore from '@stores/deploymentStore';
import RegistriesTab from './tabs/RegistriesTab';
import ImagesTab from './tabs/ImagesTab';
import DeploymentsTab from './tabs/DeploymentsTab';
import HistoryTab from './tabs/HistoryTab';
import { DeploymentsTab as DeploymentsTabEnum } from '@constants';
import { ContainerImage } from '@/types';

interface DeploymentDashboardProps {
  activeTab?: string;
  showDeployModal?: boolean;
  setShowDeployModal?: (show: boolean) => void;
  preselectedImage?: ContainerImage | null;
  setPreselectedImage?: (image: ContainerImage | null) => void;
}

const DeploymentDashboard: FC<DeploymentDashboardProps> = ({ 
  activeTab = DeploymentsTabEnum.DEPLOYMENTS, 
  showDeployModal, 
  setShowDeployModal, 
  preselectedImage, 
  setPreselectedImage 
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

  const handleDeployImage = (image: ContainerImage) => {
    setPreselectedImage?.(image);
    setShowDeployModal?.(true);
  };

  // Tabs are now controlled by parent Dashboard component

  const renderTabContent = () => {
    switch (activeTab) {
      case DeploymentsTabEnum.REGISTRIES:
        return <RegistriesTab />;
      case DeploymentsTabEnum.IMAGES:
        return <ImagesTab onDeployImage={handleDeployImage} />;
      case DeploymentsTabEnum.DEPLOYMENTS:
        return (
          <DeploymentsTab 
            showDeployModal={showDeployModal} 
            setShowDeployModal={setShowDeployModal}
            preselectedImage={preselectedImage}
            setPreselectedImage={setPreselectedImage}
          />
        );
      case DeploymentsTabEnum.HISTORY:
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