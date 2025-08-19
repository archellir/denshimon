import type { Registry } from '@/types/deployments';
import { MASTER_REGISTRIES } from '../masterData';

// Convert master data to Registry type
export const mockRegistries: Registry[] = MASTER_REGISTRIES.map(registry => ({
  id: registry.id,
  name: registry.name,
  type: registry.type,
  status: registry.status,
  config: {
    url: (registry as any).url,
    username: (registry as any).username,
    password: (registry as any).password,
    token: (registry as any).token,
  },
  error: (registry as any).description?.includes('authentication') ? (registry as any).description : undefined,
  createdAt: (registry as any).created,
  updatedAt: (registry as any).lastTested,
}));

export const generateMockRegistryTest = (registryId: string) => {
  const registry = mockRegistries.find(r => r.id === registryId);
  if (!registry) return false;
  
  // Simulate success rate based on status
  return registry.status === 'connected' ? Math.random() > 0.1 : Math.random() > 0.8;
};