import { useEffect, useState, type FC } from 'react';
import { Package, Play } from 'lucide-react';
import useDeploymentStore from '@stores/deploymentStore';
import { ContainerImage } from '@/types';
import CustomButton from '@components/common/CustomButton';
import DeploymentModal from '@components/deployments/DeploymentModal';

const ImagesTab: FC = () => {
  const { images, loading, fetchImages } = useDeploymentStore();
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ContainerImage | null>(null);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDeploy = (image: ContainerImage) => {
    setSelectedImage(image);
    setShowDeployModal(true);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <>
      {loading.images ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={`skeleton-${index}`} className="border border-white/20 p-4 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-white/10 rounded w-24"></div>
                </div>
                <div className="h-8 bg-white/10 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 bg-white/10 rounded w-12"></div>
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                  <div className="h-3 bg-white/10 rounded w-20"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-white/10 rounded w-14"></div>
                  <div className="h-3 bg-white/10 rounded w-24"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-white/10 rounded w-12"></div>
                  <div className="h-3 bg-white/10 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="border border-white/20 p-8 text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-mono mb-2">NO IMAGES FOUND</h3>
          <p className="text-gray-400">
            No images available. Add registries to browse images.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={`${image.registry}-${image.repository}-${image.tag}-${index}`} className="border border-white/20 p-4 hover:border-white/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono font-bold text-sm truncate">{image.repository}</h3>
                  <p className="text-sm text-green-400 font-mono">{image.tag}</p>
                  <p className="text-xs text-gray-400">{image.registry}</p>
                </div>
                <CustomButton
                  label="DEPLOY"
                  icon={Play}
                  onClick={() => handleDeploy(image)}
                  color="green"
                  className="w-auto px-3 py-1"
                />
              </div>

              <div className="space-y-2 text-xs">
                {image.size > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span>{formatSize(image.size)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform:</span>
                  <span>{image.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span>{new Date(image.created).toLocaleDateString()}</span>
                </div>
                {image.digest && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Digest:</span>
                    <span className="font-mono truncate" title={image.digest}>
                      {image.digest.split(':')[1]?.substring(0, 12)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DeploymentModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        preselectedImage={selectedImage}
      />
    </>
  );
};

export default ImagesTab;