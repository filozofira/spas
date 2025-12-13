/**
 * Unpublish Service
 * 
 * Orchestrates service unpublishing operations.
 * Provides validation and consistent interface for deletion.
 */

import type { IStorageProvider } from '../storage/IStorageProvider';

export class UnpublishService {
  constructor(private storage: IStorageProvider) {}

  /**
   * Unpublish a specific service version
   * Removes metadata and all associated schemas atomically
   * Per FR-021 and User Story 5
   * 
   * @param serviceName - The service identifier
   * @param version - The version to unpublish
   * @returns true if service existed and was deleted, false if it didn't exist
   */
  async unpublishVersion(serviceName: string, version: string): Promise<boolean> {
    // Check if service exists before deletion
    const exists = await this.storage.serviceExists(serviceName, version);
    
    if (!exists) {
      return false;
    }

    // Delete service and associated schemas atomically
    await this.storage.deleteService(serviceName, version);
    
    return true;
  }
}
