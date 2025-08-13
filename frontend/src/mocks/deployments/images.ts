import type { ContainerImage } from '@/types/deployments';
import { MASTER_IMAGES, MASTER_REGISTRIES } from '../masterData';

// Convert master data to ContainerImage type
export const mockImages: ContainerImage[] = MASTER_IMAGES.map(image => {
  const registry = MASTER_REGISTRIES.find(r => r.id === image.registry);
  return {
    registry: registry?.name || image.registry,
    repository: image.repository,
    tag: image.tag,
    platform: image.platform,
    size: image.size,
    created: image.created,
    digest: image.digest,
    fullName: `${image.repository}:${image.tag}`,
  };
});

// Generate additional mock images for search variety
export const generateMockImagesForRegistry = (registryName: string): ContainerImage[] => {
  const additionalImages = [
    { repository: 'ubuntu', tag: 'latest', size: 72847293 },
    { repository: 'alpine', tag: '3.18', size: 7328164 },
    { repository: 'node', tag: '18-alpine', size: 143692847 },
    { repository: 'python', tag: '3.11-slim', size: 126847291 },
    { repository: 'golang', tag: '1.21-alpine', size: 384729164 },
    { repository: 'mysql', tag: '8.0', size: 449273856 },
  ];

  return additionalImages.map((img, index) => ({
    registry: registryName,
    repository: img.repository,
    tag: img.tag,
    platform: 'linux/amd64',
    size: img.size,
    created: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    digest: `sha256:${Math.random().toString(36).substr(2, 12)}${Math.random().toString(36).substr(2, 12)}`,
    fullName: `${img.repository}:${img.tag}`,
  }));
};

// Filter images by registry and search query
export const searchMockImages = (query: string, registryFilter?: string): ContainerImage[] => {
  let filteredImages = mockImages;
  
  // Add additional images for Docker Hub
  const dockerHubImages = generateMockImagesForRegistry('Docker Hub');
  filteredImages = [...filteredImages, ...dockerHubImages];
  
  // Filter by registry
  if (registryFilter) {
    filteredImages = filteredImages.filter(img => img.registry === registryFilter);
  }
  
  // Filter by search query
  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    filteredImages = filteredImages.filter(img => 
      img.repository.toLowerCase().includes(lowerQuery) ||
      img.tag.toLowerCase().includes(lowerQuery) ||
      img.registry.toLowerCase().includes(lowerQuery)
    );
  }
  
  return filteredImages.slice(0, 50); // Limit results for performance
};