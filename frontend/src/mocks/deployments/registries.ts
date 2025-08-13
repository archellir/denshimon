import type { Registry } from '@/types/deployments';
import { MASTER_REGISTRIES } from '../masterData';

// Convert master data to Registry type
export const mockRegistries: Registry[] = MASTER_REGISTRIES.map(registry => ({
  id: registry.id,
  name: registry.name,
  type: registry.type,
  status: registry.status,
  config: {
    url: registry.url,
    namespace: registry.namespace,
  },
  error: 'error' in registry ? registry.error : undefined,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
  updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 7 days
}));

export const generateMockRegistryTest = (registryId: string) => {
  const registry = mockRegistries.find(r => r.id === registryId);
  if (!registry) return false;
  
  // Simulate success rate based on status
  return registry.status === 'connected' ? Math.random() > 0.1 : Math.random() > 0.8;
};