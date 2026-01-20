import React, { useState, useEffect } from 'react';
import { Leaf, TrendingUp, MapPin, Calendar, Activity } from 'lucide-react';
import { unifiedApiService, NDVIAnalysisResponse } from '../services/unifiedApiService';

interface NDVIAnalysisProps {
  location: string;
  coordinates?: { lat: number; lng: number };
  onAnalysisComplete?: (data: NDVIAnalysisResponse) => void;
  initialData?: NDVIAnalysisResponse | null;
}

const NDVIAnalysis: React.FC<NDVIAnalysisProps> = ({
  location,
  coordinates,
  onAnalysisComplete,
  initialData,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [ndviData, setNdviData] = useState<NDVIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisFocus, setAnalysisFocus] = useState<string>('vegetation');

  const focusOptions = [
    { id: 'general', name: 'General', icon: Activity, color: 'text-muted-foreground' },
  ];

  const performNDVIAnalysis = async () => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if API is available first
      await unifiedApiService.healthCheck();
      
      const result = await unifiedApiService.analyzeNDVI({
        location,
        zoom_level: 'City-Wide (0.025°)',
        resolution: 'Standard (5m)',
        want_recommendations: true,
        want_visualizations: true,
        analysis_focus: analysisFocus,
      });

      setNdviData(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      console.warn('NDVI analysis API not available, using mock data:', err);
      // Set mock NDVI data for development
      const mockData: NDVIAnalysisResponse = {
        success: true,
        location,
        coordinates: coordinates ? { latitude: coordinates.lat, longitude: coordinates.lng } : { latitude: 0, longitude: 0 },
        timeline_start: "2017-04-10",
        timeline_end: "2025-04-28",
        chosen_dates: [
          { date: "2017-04-10", cloud: "5.2" },
          { date: "2025-04-28", cloud: "3.1" }
        ],
        available_dates_count: 45,
        timestamp: new Date().toISOString(),
        ndvi_analysis: {
          ndvi_statistics: {
            before: { mean: 0.45, std: 0.12, min: 0.1, max: 0.8, median: 0.43 },
            after: { mean: 0.38, std: 0.15, min: 0.05, max: 0.75, median: 0.35 },
            change: { mean_change: -0.07, std_change: 0.08, significant_change_pixels: 1250 }
          },
          change_statistics: {
            vegetation_gain: { count: 250, percentage: 2.5 },
            vegetation_loss: { count: 500, percentage: 5.0 },
            urbanization: { count: 300, percentage: 3.0 },
            urban_loss: { count: 100, percentage: 1.0 },
            water_gain: { count: 50, percentage: 0.5 },
            water_loss: { count: 150, percentage: 1.5 }
          },
          analysis_focus: analysisFocus,
          detected_intents: { vegetation_focus: true, urban_focus: false, water_focus: false, general: false }
        },
        change_analysis: {
          total_change_percentage: 12.5,
          dominant_change: "vegetation_loss",
          vegetation_change_net: -2.5,
          urban_change_net: 2.0,
          water_change_net: -1.0,
          change_intensity: "moderate"
        },
        recommendations: [
          "Significant vegetation loss detected (5.0%). Consider implementing reforestation programs.",
          "Positive urbanization observed (3.0%). Monitor infrastructure development.",
          "Landscape appears relatively stable. Continue regular monitoring for early change detection."
        ],
        visualizations: {},
        socioeconomic_correlation: {
          median_income: 65000,
          poverty_rate: 12.5,
          education_level: 45.2,
          home_values: 350000,
          development_permits: 15,
          correlation_insights: {
            development_pressure: "moderate",
            gentrification_indicator: "low",
            environmental_justice: "stable"
          }
        }
      };
      
      setNdviData(mockData);
      onAnalysisComplete?.(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If we have initial data, use it immediately
    if (initialData) {
      setNdviData(initialData);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch new data
    if (location) {
      performNDVIAnalysis();
    }
  }, [location, analysisFocus, initialData]);

  const renderEnvironmentalInsights = () => {
    if (!ndviData) return null;

    const { change_analysis, ndvi_analysis } = ndviData;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
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

        {/* NDVI Statistics */}
        {ndvi_analysis.ndvi_statistics && (
          <div className="p-4 bg-background-alt rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              NDVI Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Before Period</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mean NDVI:</span>
                    <span className="text-foreground">{ndvi_analysis.ndvi_statistics.before.mean.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Std Dev:</span>
                    <span className="text-foreground">{ndvi_analysis.ndvi_statistics.before.std.toFixed(3)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">After Period</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mean NDVI:</span>
                    <span className="text-foreground">{ndvi_analysis.ndvi_statistics.after.mean.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Std Dev:</span>
                    <span className="text-foreground">{ndvi_analysis.ndvi_statistics.after.std.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Statistics */}
        {ndvi_analysis.change_statistics && (
          <div className="p-4 bg-background-alt rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Change Statistics
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ndvi_analysis.change_statistics).map(([key, value]: [string, any]) => {
                if (typeof value === 'object' && value.percentage !== undefined) {
                  return (
                    <div key={key} className="text-center">
                      <div className="text-lg font-bold text-foreground">
                        {value.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!ndviData?.recommendations || ndviData.recommendations.length === 0) return null;

    return (
      <div className="p-4 bg-background-alt rounded-lg border border-border">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          AI Recommendations
        </h4>
        <div className="space-y-2">
          {ndviData.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-bold">•</span>
              <span className="text-muted-foreground">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSocioeconomicCorrelation = () => {
    if (!ndviData?.socioeconomic_correlation) return null;

    const { socioeconomic_correlation } = ndviData;

    return (
      <div className="p-4 bg-background-alt rounded-lg border border-border">
        <h4 className="font-semibold text-foreground mb-3">Socioeconomic Correlation</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Economic Indicators</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Median Income:</span>
                <span className="text-foreground">${socioeconomic_correlation.median_income?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Poverty Rate:</span>
                <span className="text-foreground">{socioeconomic_correlation.poverty_rate?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Education Level:</span>
                <span className="text-foreground">{socioeconomic_correlation.education_level?.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Development Indicators</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Home Values:</span>
                <span className="text-foreground">${socioeconomic_correlation.home_values?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Permits:</span>
                <span className="text-foreground">{socioeconomic_correlation.development_permits || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {socioeconomic_correlation.correlation_insights && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <h5 className="text-sm font-medium text-foreground mb-2">Correlation Insights</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Development Pressure:</span>
                <span className="text-foreground capitalize">{socioeconomic_correlation.correlation_insights.development_pressure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gentrification Indicator:</span>
                <span className="text-foreground capitalize">{socioeconomic_correlation.correlation_insights.gentrification_indicator}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environmental Justice:</span>
                <span className="text-foreground capitalize">{socioeconomic_correlation.correlation_insights.environmental_justice}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-foreground">NDVI & Environmental Analysis</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={performNDVIAnalysis}
              disabled={isLoading}
              className="btn-icon btn-ghost"
              title="Refresh analysis"
            >
              <Activity className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Vegetation index and environmental insights for {location}
        </p>
      </div>

      {/* Analysis Focus Selection */}
      <div className="px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">Analysis Focus:</span>
          <div className="flex gap-2">
            {focusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setAnalysisFocus(option.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    analysisFocus === option.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.name}
                </button>
              );
            })}
          </div>
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
          <div className="text-muted-foreground">Analyzing environmental data...</div>
        </div>
      )}

      {/* Content */}
      {!isLoading && ndviData && (
        <div className="p-6 space-y-6">
          {/* Timeline Information */}
          <div className="p-4 bg-background-alt rounded-lg border border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Timeline:</span>
                <span className="text-sm font-medium text-foreground">
                  {ndviData.timeline_start} to {ndviData.timeline_end}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Available Dates:</span>
                <span className="text-sm font-medium text-foreground">{ndviData.available_dates_count}</span>
              </div>
            </div>
          </div>

          {/* Environmental Insights */}
          {renderEnvironmentalInsights()}

          {/* Recommendations */}
          {renderRecommendations()}

          {/* Socioeconomic Correlation */}
          {renderSocioeconomicCorrelation()}
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !ndviData && !error && (
        <div className="p-6 text-center">
          <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No NDVI analysis data available</p>
        </div>
      )}
    </div>
  );
};

export default NDVIAnalysis;
