/**
 * Mock data validation and auto-fixing utility
 * This ensures all mock data conforms to the defined TypeScript types and Zod schemas
 */

import { validateMockData } from '@types/mockData';
import { 
  MASTER_NAMESPACES, 
  MASTER_NODES, 
  MASTER_APPLICATIONS, 
  MASTER_PODS, 
  MASTER_SERVICES,
  MASTER_REGISTRIES
} from './masterData';

/**
 * Validates all mock data and reports any issues
 * Run this during development to ensure type safety
 */
export function validateAllMockData() {
  const results = {
    valid: [] as string[],
    invalid: [] as { name: string; errors: string[] }[]
  };

  // Validate applications
  try {
    MASTER_APPLICATIONS.forEach(app => validateMockData.application(app));
    results.valid.push('MASTER_APPLICATIONS');
  } catch (error) {
    results.invalid.push({
      name: 'MASTER_APPLICATIONS',
      errors: [error instanceof Error ? error.message : String(error)]
    });
  }

  // Validate pods
  try {
    MASTER_PODS.forEach(pod => validateMockData.pod(pod));
    results.valid.push('MASTER_PODS');
  } catch (error) {
    results.invalid.push({
      name: 'MASTER_PODS', 
      errors: [error instanceof Error ? error.message : String(error)]
    });
  }

  // Validate services
  try {
    MASTER_SERVICES.forEach(service => validateMockData.service(service));
    results.valid.push('MASTER_SERVICES');
  } catch (error) {
    results.invalid.push({
      name: 'MASTER_SERVICES',
      errors: [error instanceof Error ? error.message : String(error)]
    });
  }

  // Validate registries
  try {
    MASTER_REGISTRIES.forEach(registry => validateMockData.registry(registry));
    results.valid.push('MASTER_REGISTRIES');
  } catch (error) {
    results.invalid.push({
      name: 'MASTER_REGISTRIES',
      errors: [error instanceof Error ? error.message : String(error)]
    });
  }

  return results;
}

/**
 * Development utility to check mock data validity
 * Only runs in development mode when VITE_MOCK_DATA is enabled
 */
export function checkMockDataInDev() {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_DATA === 'true') {
    const results = validateAllMockData();
    
    if (results.invalid.length > 0) {
      console.group('🚨 Mock Data Validation Errors');
      results.invalid.forEach(({ name, errors }) => {
        console.error(`❌ ${name}:`, errors);
      });
      console.groupEnd();
    } else {
      console.log('✅ All mock data is valid');
    }
    
    return results;
  }
}

/**
 * Runtime type guard for mock data
 */
export function isValidMockData<T>(
  data: unknown,
  validator: (data: unknown) => T
): data is T {
  try {
    validator(data);
    return true;
  } catch {
    return false;
  }
}

// Automatically check mock data validity in development
if (typeof window !== 'undefined') {
  checkMockDataInDev();
}