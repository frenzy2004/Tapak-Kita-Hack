import { Location } from '../types';
import { API_CONFIG, ERROR_MESSAGES } from '../config/api';

// API Configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// Types for API responses
export interface ChangeDetectionRequest {
  location: string;
  zoom_level?: string;
  resolution?: string;
  alpha?: number;
}

export interface ChangeDetectionResponse {
  success: boolean;
  message: string;
  coordinates?: { latitude: number; longitude: number };
  dates?: { before: string; after: string };
  statistics?: {
    changed_pixels: number;
    total_pixels: number;
    change_percentage: number;
  };
  images?: {
    before: string;
    after: string;
    mask: string;
    overlay: string;
  };
  socioeconomic_data?: any;
  real_estate_data?: any;
  comprehensive_analysis?: any;
  model_info?: {
    model_used: string;
    model_type: string;
    confidence: number;
    pytorch_available: boolean;
    tensorflow_available: boolean;
  };
}

export interface NDVIAnalysisRequest {
  location: string;
  timeline_start?: string;
  timeline_end?: string;
  zoom_level?: string;
  resolution?: string;
  want_recommendations?: boolean;
  want_visualizations?: boolean;
  analysis_focus?: string;
}

export interface NDVIAnalysisResponse {
  success: boolean;
  location: string;
  coordinates: { latitude: number; longitude: number };
  timeline_start: string;
  timeline_end: string;
  chosen_dates: Array<{ date: string; cloud: string }>;
  available_dates_count: number;
  timestamp: string;
  ndvi_analysis: {
    ndvi_statistics: any;
    change_statistics: any;
    analysis_focus: string;
    detected_intents: any;
  };
  change_analysis: {
    total_change_percentage: number;
    dominant_change: string;
    vegetation_change_net: number;
    urban_change_net: number;
    water_change_net: number;
    change_intensity: string;
  };
  recommendations: string[];
  visualizations: Record<string, string>;
  socioeconomic_correlation?: any;
}

export interface LocationSearchResponse {
  status: string;
  locations: Array<{
    name: string;
    display_name: string;
    coordinates: { lat: number; lon: number };
    bbox?: any;
    place_type: string;
    country: string;
  }>;
}

class UnifiedApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { 
        ...defaultOptions, 
        ...options,
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(ERROR_MESSAGES.LOCATION_NOT_FOUND);
        } else if (response.status === 429) {
          throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(ERROR_MESSAGES.API_CONNECTION_FAILED);
        }
        throw error;
      }
      throw new Error(ERROR_MESSAGES.API_CONNECTION_FAILED);
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.makeRequest('/health');
  }

  // Get API info
  async getApiInfo(): Promise<any> {
    return this.makeRequest('/');
  }

  // Enhanced change detection
  async detectChange(request: ChangeDetectionRequest): Promise<ChangeDetectionResponse> {
    return this.makeRequest<ChangeDetectionResponse>('/detect-change', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // NDVI analysis
  async analyzeNDVI(request: NDVIAnalysisRequest): Promise<NDVIAnalysisResponse> {
    return this.makeRequest<NDVIAnalysisResponse>('/analyze/ndvi', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Quick NDVI analysis
  async quickNDVIAnalysis(location: string, zoomLevel: string = 'City-Wide (0.025°)'): Promise<NDVIAnalysisResponse> {
    return this.makeRequest<NDVIAnalysisResponse>(`/analyze/ndvi/${encodeURIComponent(location)}/quick?zoom_level=${encodeURIComponent(zoomLevel)}`);
  }

  // Search locations
  async searchLocations(query: string, limit: number = 10): Promise<LocationSearchResponse> {
    return this.makeRequest<LocationSearchResponse>('/locations/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  // Get location coordinates
  async getLocationCoordinates(location: string): Promise<{ location: string; latitude: number; longitude: number }> {
    return this.makeRequest(`/locations/${encodeURIComponent(location)}/coordinates`);
  }

  // Get available dates for a location
  async getAvailableDates(lat: number, lon: number, zoomLevel: string = 'City-Wide (0.025°)'): Promise<{
    status: string;
    available_dates: string[];
    total_dates: number;
  }> {
    return this.makeRequest(`/locations/dates?lat=${lat}&lon=${lon}&zoom_level=${encodeURIComponent(zoomLevel)}`);
  }

  // Get socioeconomic data
  async getSocioeconomicData(location: string): Promise<any> {
    return this.makeRequest(`/locations/${encodeURIComponent(location)}/socioeconomic`);
  }

  // Get model comparison
  async compareModels(request: {
    location: string;
    zoom_level?: string;
    resolution?: string;
    alpha?: number;
  }): Promise<any> {
    return this.makeRequest('/compare-models', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get model info
  async getModelInfo(): Promise<any> {
    return this.makeRequest('/models/info');
  }

  // Get analysis history
  async getAnalysisHistory(limit: number = 50, offset: number = 0): Promise<any> {
    return this.makeRequest(`/analyze/history?limit=${limit}&offset=${offset}`);
  }

  // Get analysis by ID
  async getAnalysisById(analysisId: string): Promise<any> {
    return this.makeRequest(`/analyze/history/${analysisId}`);
  }

  // Delete analysis
  async deleteAnalysis(analysisId: string): Promise<{ status: string; message: string }> {
    return this.makeRequest(`/analyze/history/${analysisId}`, {
      method: 'DELETE',
    });
  }

  // Get system info
  async getSystemInfo(): Promise<any> {
    return this.makeRequest('/system/info');
  }

  // Get analysis summary
  async getAnalysisSummary(): Promise<any> {
    return this.makeRequest('/stats/summary');
  }
}

// Create singleton instance
export const unifiedApiService = new UnifiedApiService();

// Helper function to convert location to coordinates
export const getLocationCoordinates = async (location: string): Promise<Location | null> => {
  try {
    const result = await unifiedApiService.getLocationCoordinates(location);
    return {
      lat: result.latitude,
      lng: result.longitude,
      address: result.location,
    };
  } catch (error) {
    console.error('Failed to get coordinates:', error);
    return null;
  }
};

// Helper function to perform change detection analysis
export const performChangeDetection = async (
  location: string,
  options: Partial<ChangeDetectionRequest> = {}
): Promise<ChangeDetectionResponse | null> => {
  try {
    const request: ChangeDetectionRequest = {
      location,
      zoom_level: 'City-Wide (0.025°)',
      resolution: 'Standard (5m)',
      alpha: 0.4,
      ...options,
    };

    return await unifiedApiService.detectChange(request);
  } catch (error) {
    console.error('Change detection failed:', error);
    return null;
  }
};

// Helper function to perform NDVI analysis
export const performNDVIAnalysis = async (
  location: string,
  options: Partial<NDVIAnalysisRequest> = {}
): Promise<NDVIAnalysisResponse | null> => {
  try {
    const request: NDVIAnalysisRequest = {
      location,
      zoom_level: 'City-Wide (0.025°)',
      resolution: 'Standard (5m)',
      want_recommendations: true,
      want_visualizations: true,
      analysis_focus: 'vegetation',
      ...options,
    };

    return await unifiedApiService.analyzeNDVI(request);
  } catch (error) {
    console.error('NDVI analysis failed:', error);
    return null;
  }
};

export default unifiedApiService;
