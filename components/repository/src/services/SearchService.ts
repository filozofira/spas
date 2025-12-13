/**
 * Search Service
 * 
 * Orchestrates service search operations by capability and bounded context.
 * Provides consistent interface for search functionality across different queries.
 */

import type { IStorageProvider } from '../storage/IStorageProvider';
import type { SearchResults } from '../models/types';

export class SearchService {
  constructor(private storage: IStorageProvider) {}

  /**
   * Search services by capability
   * Returns latest version of each service that declares the capability
   * Per FR-017 and User Story 3
   */
  async searchByCapability(capability: string): Promise<SearchResults> {
    if (!capability || capability.trim() === '') {
      throw new Error('Capability parameter is required');
    }

    const results = await this.storage.searchByCapability(capability.trim());

    return {
      total: results.length,
      limit: results.length,
      offset: 0,
      results,
    };
  }

  /**
   * Search services by bounded context
   * Returns latest version of each service in the bounded context
   * Per FR-018 and User Story 4
   */
  async searchByBoundedContext(context: string): Promise<SearchResults> {
    if (!context || context.trim() === '') {
      throw new Error('Bounded context parameter is required');
    }

    const results = await this.storage.searchByBoundedContext(context.trim());

    return {
      total: results.length,
      limit: results.length,
      offset: 0,
      results,
    };
  }
}
