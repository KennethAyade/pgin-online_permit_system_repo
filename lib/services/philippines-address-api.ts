/**
 * PSGC GitLab API Service for Philippine Administrative Divisions
 * Provides real-time data for Regions, Provinces, Cities, and Barangays
 *
 * API Documentation: https://psgc.gitlab.io/api/
 * No rate limits, no authentication required, fully free
 */

const BASE_URL = 'https://psgc.gitlab.io/api';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

interface CacheItem {
  data: any;
  timestamp: number;
}

interface Region {
  code: string;
  name: string;
  regionName?: string;
  islandGroupCode?: string;
  psgc10DigitCode?: string;
}

interface Province {
  code: string;
  name: string;
  regionCode: string;
  islandGroupCode?: string;
  psgc10DigitCode?: string;
}

interface City {
  code: string;
  name: string;
  provinceCode: string;
  islandGroupCode?: string;
  psgc10DigitCode?: string;
}

interface Barangay {
  code: string;
  name: string;
  cityCode: string;
  islandGroupCode?: string;
  psgc10DigitCode?: string;
}

class PhilippinesAddressAPI {
  private cache: Map<string, CacheItem> = new Map();
  private regionCode: string | null = null;
  private provinceCode: string | null = null;

  /**
   * Get all regions
   * @returns Array of regions
   */
  async getRegions(): Promise<Region[]> {
    try {
      const cacheKey = 'regions';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${BASE_URL}/regions.json`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw new Error('Failed to fetch regions. Please try again.');
    }
  }

  /**
   * Get provinces by region code
   * @param regionCode - The region code (e.g., "010000000" for Region I)
   * @returns Array of provinces
   */
  async getProvincesByRegion(regionCode: string): Promise<Province[]> {
    try {
      // Validate region code format
      if (!regionCode || regionCode.length !== 9) {
        throw new Error('Invalid region code format');
      }

      this.regionCode = regionCode;
      const cacheKey = `provinces_${regionCode}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${BASE_URL}/regions/${regionCode}/provinces.json`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw new Error('Failed to fetch provinces. Please try again.');
    }
  }

  /**
   * Get cities/municipalities by province code
   * @param regionCode - The region code
   * @param provinceCode - The province code
   * @returns Array of cities/municipalities
   */
  async getCitiesByProvince(regionCode: string, provinceCode: string): Promise<City[]> {
    try {
      // Validate codes
      if (!regionCode || !provinceCode) {
        throw new Error('Region and province codes are required');
      }

      this.regionCode = regionCode;
      this.provinceCode = provinceCode;
      const cacheKey = `cities_${provinceCode}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Use province code directly to get cities
      const response = await fetch(`${BASE_URL}/provinces/${provinceCode}/cities-municipalities.json`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw new Error('Failed to fetch cities. Please try again.');
    }
  }

  /**
   * Get barangays by city code
   * @param cityCode - The city/municipality code
   * @returns Array of barangays
   */
  async getBarangaysByCity(cityCode: string): Promise<Barangay[]> {
    try {
      if (!cityCode) {
        throw new Error('City code is required');
      }

      const cacheKey = `barangays_${cityCode}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${BASE_URL}/cities-municipalities/${cityCode}/barangays.json`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching barangays:', error);
      throw new Error('Failed to fetch barangays. Please try again.');
    }
  }

  /**
   * Format region name for display
   * e.g., "Region I" or "Region VII (Central Visayas)"
   */
  formatRegionName(region: Region): string {
    return region.regionName || region.name;
  }

  /**
   * Format option labels for dropdowns
   */
  formatRegionLabel(region: Region): string {
    const code = region.code.substring(0, 2); // Extract region number
    const regionName = region.regionName || region.name;
    return regionName; // Display just the name
  }

  /**
   * Clear specific cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get item from cache if not expired
   */
  private getFromCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set item in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const philippinesAddressAPI = new PhilippinesAddressAPI();

// Export class for testing purposes
export { PhilippinesAddressAPI };
