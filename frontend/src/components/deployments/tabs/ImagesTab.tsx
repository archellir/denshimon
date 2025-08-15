import { useEffect, type FC } from 'react';
import { Package, Play } from 'lucide-react';
import useDeploymentStore from '@/stores/deploymentStore';
import { ContainerImage } from '@/types';

const ImagesTab: FC = () => {
  const { 
    images, 
    loading, 
    fetchImages
  } = useDeploymentStore();

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);


  const handleDeploy = (image: ContainerImage) => {
    // This would open a deployment form modal
    console.log('Deploy image:', image);
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
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
          <span className="ml-3 font-mono">Loading images...</span>
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
                <button
                  onClick={() => handleDeploy(image)}
                  className="flex items-center space-x-1 px-3 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-xs"
                >
                  <Play size={12} />
                  <span>DEPLOY</span>
                </button>
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
    </>
  );
};

export default ImagesTab;