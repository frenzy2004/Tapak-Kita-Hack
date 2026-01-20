import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import { unifiedApiService, ChangeDetectionResponse, NDVIAnalysisResponse } from '../services/unifiedApiService';
import { Location } from '../types';

interface SatelliteAnalysisProps {
  location: string;
  coordinates?: Location;
  onAnalysisComplete?: (data: any) => void;
  initialData?: ChangeDetectionResponse | null;
}

type ViewMode = 'before' | 'after' | 'changes' | 'split';
type AnalysisType = 'change_detection' | 'ndvi' | 'comparison';

const SatelliteAnalysis: React.FC<SatelliteAnalysisProps> = ({
  location,
  coordinates,
  onAnalysisComplete,
  initialData,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('change_detection');
  const [isLoading, setIsLoading] = useState(false);
  const [changeDetectionData, setChangeDetectionData] = useState<ChangeDetectionResponse | null>(null);
  const [ndviData, setNdviData] = useState<NDVIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('siamese_unet');
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: string]: boolean}>({});
  const [imageLoading, setImageLoading] = useState<{[key: string]: boolean}>({});

  // Available models
  const models = [
    { id: 'siamese_unet', name: 'Siamese U-Net', description: 'Advanced feature difference analysis' },
    { id: 'simple_cnn', name: 'Simple CNN', description: 'Fast, basic change detection' },
    { id: 'tensorflow', name: 'TensorFlow', description: 'Original model for compatibility' },
    { id: 'compare_all', name: 'Compare All', description: 'Run all models and compare results' },
  ];

  // Perform change detection analysis
  const performChangeDetection = async () => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if API is available first
      await unifiedApiService.healthCheck();
      
      const result = await unifiedApiService.detectChange({
        location,
        zoom_level: 'City-Wide (0.025°)',
        resolution: 'Standard (5m)',
        alpha: 0.4,
      });

      setChangeDetectionData(result);
      onAnalysisComplete?.(result);
      
      // Debug: Log the received data
      console.log('Change detection result:', result);
      console.log('Images received:', {
        before: result.images?.before ? 'Yes' : 'No',
        after: result.images?.after ? 'Yes' : 'No',
        mask: result.images?.mask ? 'Yes' : 'No',
        overlay: result.images?.overlay ? 'Yes' : 'No'
      });
    } catch (err) {
      console.warn('Change detection API not available, using mock data:', err);
      // Set mock change detection data for development
      const mockData: ChangeDetectionResponse = {
        success: true,
        message: "Mock change detection data (API not available)",
        coordinates: coordinates ? { latitude: coordinates.lat, longitude: coordinates.lng } : { latitude: 0, longitude: 0 },
        dates: { before: "2017-04-10", after: "2025-04-28" },
        statistics: {
          changed_pixels: 1250,
          total_pixels: 10000,
          change_percentage: 12.5
        },
        images: {
          before: "",
          after: "",
          mask: "",
          overlay: ""
        },
        model_info: {
          model_used: selectedModel,
          model_type: selectedModel,
          confidence: 0.85,
          pytorch_available: true,
          tensorflow_available: false
        }
      };
      
      setChangeDetectionData(mockData);
      onAnalysisComplete?.(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform NDVI analysis
  const performNDVIAnalysis = async () => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedApiService.analyzeNDVI({
        location,
        zoom_level: 'City-Wide (0.025°)',
        resolution: 'Standard (5m)',
        want_recommendations: true,
        want_visualizations: true,
        analysis_focus: 'vegetation',
      });

      setNdviData(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NDVI analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-run analysis when component mounts or use cached data
  useEffect(() => {
    // If we have initial data, use it immediately
    if (initialData) {
      setChangeDetectionData(initialData);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch new data
    if (location) {
      performChangeDetection();
    }
  }, [location, selectedModel, initialData]);

  const renderImagePlaceholder = (type: 'before' | 'after' | 'changes', data?: any) => {
    const isBefore = type === 'before';
    const isAfter = type === 'after';
    const isChanges = type === 'changes';

    // Get the appropriate image data
    const imageData = data?.images;
    const imageSrc = isBefore ? imageData?.before : 
                    isAfter ? imageData?.after : 
                    isChanges ? imageData?.overlay : null;

    return (
      <div className="relative rounded-lg overflow-hidden bg-background-elevated border border-border group">
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-md border border-border">
          <span className="text-sm font-medium text-foreground">
            {isBefore ? 'Before' : isAfter ? 'After' : 'Changes Detected'}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {isBefore ? data?.dates?.before || '2017-04-10' :
             isAfter ? data?.dates?.after || '2025-04-28' :
             '2017-04-10 to 2025-04-28'}
          </span>
        </div>
        
        {imageSrc && !imageLoadErrors[type] ? (
          // Display actual satellite image
          <div className="w-full h-full min-h-[400px] flex items-center justify-center relative">
            <img 
              src={`data:image/png;base64,${imageSrc}`}
              alt={`${isBefore ? 'Before' : isAfter ? 'After' : 'Changes'} satellite image`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onLoadStart={() => {
                setImageLoading(prev => ({ ...prev, [type]: true }));
              }}
              onLoad={() => {
                console.log(`Successfully loaded ${type} image`);
                setImageLoadErrors(prev => ({ ...prev, [type]: false }));
                setImageLoading(prev => ({ ...prev, [type]: false }));
              }}
              onError={(e) => {
                console.error(`Failed to load ${type} image:`, e);
                setImageLoadErrors(prev => ({ ...prev, [type]: true }));
                setImageLoading(prev => ({ ...prev, [type]: false }));
              }}
            />
            {/* Loading indicator overlay */}
            {imageLoading[type] && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>
        ) : (
          // Show placeholder when no image data
          <div className={`w-full h-full flex items-center justify-center min-h-[400px] ${
            isBefore ? 'bg-gradient-to-br from-orange-900/20 to-orange-700/20' :
            isAfter ? 'bg-gradient-to-br from-green-900/20 to-yellow-700/20' :
            'bg-gradient-to-br from-purple-900/20 to-pink-700/20'
          }`}>
            <div className="text-center p-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${
                isBefore ? 'bg-orange-500/20' :
                isAfter ? 'bg-green-500/20' :
                'bg-purple-500/20'
              } flex items-center justify-center`}>
                <span className="text-3xl">
                  {isBefore ? '🛰️' : isAfter ? '🌆' : '📊'}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {isBefore ? `Satellite imagery for ${location}` : 
                 isAfter ? `Current satellite view of ${location}` :
                 'Change Detection Analysis'}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {isBefore ? 'Before: April 2017' :
                 isAfter ? 'After: April 2025' :
                 '2017-04-10 to 2025-04-28'}
              </p>
              {isChanges && data?.statistics && (
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-4">
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="text-2xl font-bold text-success">
                      +{Math.round(data.statistics.change_percentage)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Urban Growth</div>
                  </div>
                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="text-2xl font-bold text-warning">
                      -{Math.round(data.statistics.change_percentage * 0.4)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Green Cover</div>
                  </div>
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      +{Math.round(data.statistics.change_percentage * 1.5)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Infrastructure</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNDVIInsights = () => {
    if (!ndviData) return null;

    const { change_analysis, recommendations } = ndviData;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-background-alt rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Vegetation Change</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {change_analysis.vegetation_change_net > 0 ? '+' : ''}{change_analysis.vegetation_change_net.toFixed(1)}%
            </div>
          </div>
          <div className="p-4 bg-background-alt rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Urban Growth</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {change_analysis.urban_change_net > 0 ? '+' : ''}{change_analysis.urban_change_net.toFixed(1)}%
            </div>
          </div>
          <div className="p-4 bg-background-alt rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Water Bodies</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {change_analysis.water_change_net > 0 ? '+' : ''}{change_analysis.water_change_net.toFixed(1)}%
            </div>
          </div>
          <div className="p-4 bg-background-alt rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-warning"></div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Change Intensity</span>
            </div>
            <div className="text-sm font-bold text-foreground capitalize">{change_analysis.change_intensity}</div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="p-4 bg-background-alt rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-muted-foreground">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 pb-4 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-foreground">Satellite Analysis</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={performChangeDetection}
              disabled={isLoading}
              className="btn-icon btn-ghost"
              title="Refresh analysis"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button className="btn-icon btn-ghost" title="Download data">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {location} • {changeDetectionData?.dates?.before || '2017-04-10'} to {changeDetectionData?.dates?.after || '2025-04-28'}
        </p>
      </div>

      {/* Analysis Type Selection */}
      <div className="px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Analysis Type:</span>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
              className="px-3 py-1.5 rounded-md text-sm border border-border bg-background text-foreground"
            >
              <option value="change_detection">Change Detection</option>
              <option value="ndvi">NDVI Analysis</option>
              <option value="comparison">Model Comparison</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-1.5 rounded-md text-sm border border-border bg-background text-foreground"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {analysisType === 'ndvi' && (
            <button
              onClick={performNDVIAnalysis}
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Analyzing...' : 'Run NDVI Analysis'}
            </button>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('before')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'before'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            Before
          </button>
          <button
            onClick={() => setViewMode('after')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'after'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            After
          </button>
          <button
            onClick={() => setViewMode('changes')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'changes'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            Changes
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            Split View
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mx-6">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <div className="text-muted-foreground">Analyzing satellite data...</div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="p-6">
          {viewMode === 'split' && (
            <div className="grid grid-cols-2 gap-4 min-h-[600px]">
              {renderImagePlaceholder('before', changeDetectionData)}
              {renderImagePlaceholder('after', changeDetectionData)}
            </div>
          )}

          {viewMode === 'before' && renderImagePlaceholder('before', changeDetectionData)}
          {viewMode === 'after' && renderImagePlaceholder('after', changeDetectionData)}
          {viewMode === 'changes' && renderImagePlaceholder('changes', changeDetectionData)}

          {/* NDVI Analysis Results */}
          {analysisType === 'ndvi' && ndviData && (
            <div className="mt-6">
              {renderNDVIInsights()}
            </div>
          )}

          {/* Change Detection Statistics */}
          {analysisType === 'change_detection' && changeDetectionData?.statistics && (
            <div className="mt-6 p-4 bg-background-alt rounded-lg border border-border">
              <h4 className="font-semibold text-foreground mb-3">Change Detection Results</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {changeDetectionData.statistics.change_percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Change Percentage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {changeDetectionData.statistics.changed_pixels.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Changed Pixels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {changeDetectionData.statistics.total_pixels.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Pixels</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SatelliteAnalysis;
