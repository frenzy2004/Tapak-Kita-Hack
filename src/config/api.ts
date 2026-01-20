// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  TIMEOUT: 120000, // 120 seconds (2 minutes) for satellite imagery
  RETRY_ATTEMPTS: 3,
};

// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  LIBRARIES: ['places', 'geometry'] as const,
  VERSION: '3.58',
};

// Satellite Analysis Configuration
export const SATELLITE_CONFIG = {
  DEFAULT_ZOOM_LEVEL: 'City-Wide (0.025°)',
  DEFAULT_RESOLUTION: 'Standard (5m)',
  DEFAULT_ALPHA: 0.4,
  DEFAULT_MODEL: 'siamese_unet',
  USE_PYTORCH: true,
};

// NDVI Analysis Configuration
export const NDVI_CONFIG = {
  DEFAULT_ANALYSIS_FOCUS: 'vegetation',
  WANT_RECOMMENDATIONS: true,
  WANT_VISUALIZATIONS: true,
  TIMELINE_START: '2017-01-01',
  TIMELINE_END: new Date().toISOString().split('T')[0],
};

// Model Configuration
export const MODEL_CONFIG = {
  AVAILABLE_MODELS: [
    { id: 'siamese_unet', name: 'Siamese U-Net', description: 'Advanced feature difference analysis' },
    { id: 'simple_cnn', name: 'Simple CNN', description: 'Fast, basic change detection' },
    { id: 'tensorflow', name: 'TensorFlow', description: 'Original model for compatibility' },
    { id: 'compare_all', name: 'Compare All', description: 'Run all models and compare results' },
  ],
  DEFAULT_MODEL: 'siamese_unet',
};

// Analysis Focus Options
export const ANALYSIS_FOCUS_OPTIONS = [
  { id: 'vegetation', name: 'Vegetation', icon: 'Leaf', color: 'text-success' },
  { id: 'urban', name: 'Urban Development', icon: 'Building', color: 'text-accent' },
  { id: 'water', name: 'Water Bodies', icon: 'Droplets', color: 'text-primary' },
  { id: 'general', name: 'General', icon: 'Activity', color: 'text-muted-foreground' },
];

// Error Messages
export const ERROR_MESSAGES = {
  API_CONNECTION_FAILED: 'Failed to connect to the analysis API. Please check your connection and try again.',
  LOCATION_NOT_FOUND: 'Location not found. Please try a different address or check the spelling.',
  SATELLITE_DATA_UNAVAILABLE: 'Satellite data is not available for this location. Please try a different area.',
  ANALYSIS_FAILED: 'Analysis failed. Please try again or contact support if the issue persists.',
  INVALID_COORDINATES: 'Invalid coordinates. Please provide a valid location.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETE: 'Analysis completed successfully',
  DATA_LOADED: 'Data loaded successfully',
  IMAGES_GENERATED: 'Satellite images generated',
  RECOMMENDATIONS_READY: 'AI recommendations are ready',
};

// Loading Messages
export const LOADING_MESSAGES = {
  ANALYZING_LOCATION: 'Analyzing location data...',
  FETCHING_SATELLITE_DATA: 'Fetching satellite imagery...',
  PROCESSING_CHANGES: 'Processing change detection...',
  GENERATING_NDVI: 'Generating NDVI analysis...',
  LOADING_BUSINESSES: 'Loading nearby businesses...',
  CREATING_VISUALIZATIONS: 'Creating visualizations...',
};

export default {
  API_CONFIG,
  GOOGLE_MAPS_CONFIG,
  SATELLITE_CONFIG,
  NDVI_CONFIG,
  MODEL_CONFIG,
  ANALYSIS_FOCUS_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
};
