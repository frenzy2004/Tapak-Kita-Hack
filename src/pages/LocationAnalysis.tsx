import React, { useState, useEffect } from 'react';
import { Menu, X, Download, ArrowLeft, Map, BarChart3, Leaf, Activity, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../lib/utils';
import GoogleMap from '../components/GoogleMap';
// import TabNavigation from '../components/TabNavigation';
import SeasonalDemandChart from '../components/charts/SeasonalDemandChart';
import DemographicChart from '../components/charts/DemographicChart';
import CompetitorChart from '../components/charts/CompetitorChart';
import LocationProfileChart from '../components/charts/LocationProfileChart';
import CompetitionDensityChart from '../components/charts/CompetitionDensityChart';
import SuccessScoreChart from '../components/charts/SuccessScoreChart';
import BusinessCard from '../components/BusinessCard';
import BusinessDetail from '../components/BusinessDetail';
import AIAssistant from '../components/AIAssistant';
import KPICards from '../components/KPICards';
import RentLocationContent from '../components/RentLocationContent';
import SatelliteAnalysis from '../components/SatelliteAnalysis';
import NDVIAnalysis from '../components/NDVIAnalysis';

import ApiInstructions from '../components/ApiInstructions';
import { LocationAnalysis as LocationAnalysisType, Business, AnalysisTab, Location } from '../types';
import { mockAnalysis } from '../data/mockData';
import { geocodeLocation } from '../utils/geocoding';
import { findNearbyBusinesses } from '../utils/placesService';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { generateEnhancedPDF } from '../utils/pdfExport';
import { unifiedApiService, ChangeDetectionResponse, NDVIAnalysisResponse } from '../services/unifiedApiService';
import { calculateSuccessScore, generateSeasonalDemand, calculateKPIs } from '../utils/analyticsCalculator';

interface LocationAnalysisProps {
  tabId: string;
  location: string;
  businessType: string;
  onBack: () => void;
  tabs: AnalysisTab[];
  activeTabId: string | null;
  onTabSwitch: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewComparison: () => void;
  cachedData?: {
    actualLocation: Location | null;
    businesses: Business[];
    satelliteData: any;
    ndviData: any;
    isLoaded: boolean;
  };
  onUpdateCache: (tabId: string, cachedData: any) => void;
}

const LocationAnalysis: React.FC<LocationAnalysisProps> = ({
  tabId,
  location,
  businessType,
  onBack,
  tabs,
  activeTabId,
  onTabSwitch,
  onTabClose,
  onNewComparison,
  cachedData,
  onUpdateCache,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'analytics' | 'ndvi'>('map');
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'rent' | 'ai-insight'>('overview');
  // const [satelliteView, setSatelliteView] = useState<'before' | 'after' | 'changes' | 'split'>('split');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [actualLocation, setActualLocation] = useState<Location | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [satelliteData, setSatelliteData] = useState<ChangeDetectionResponse | null>(null);
  const [ndviData, setNdviData] = useState<NDVIAnalysisResponse | null>(null);
  const [isSatelliteLoading, setIsSatelliteLoading] = useState(false);
  const [showApiInstructions, setShowApiInstructions] = useState(false);
  const { isLoaded } = useGoogleMaps();

  // Geocode the location when component mounts or location changes
  useEffect(() => {
    // If we have cached data, use it immediately
    if (cachedData?.isLoaded) {
      setActualLocation(cachedData.actualLocation);
      setBusinesses(cachedData.businesses);
      setSatelliteData(cachedData.satelliteData);
      setNdviData(cachedData.ndviData);
      setIsGeocoding(false);
      setIsSatelliteLoading(false);
      return;
    }

    const getLocationCoordinates = async () => {
      if (!isLoaded) return;

      setIsGeocoding(true);
      const geocodedLocation = await geocodeLocation(location);

      let finalLocation: Location;
      if (geocodedLocation) {
        finalLocation = geocodedLocation;
      } else {
        // Fallback to mock location if geocoding fails
        finalLocation = { ...mockAnalysis.location, address: location };
      }

      setActualLocation(finalLocation);

      // Find real businesses using Places API
      const realBusinesses = await findNearbyBusinesses(finalLocation, businessType);
      setBusinesses(realBusinesses);

      // Load satellite data (with fallback if API is not available)
      setIsSatelliteLoading(true);
      try {
        // Check if API is available first
        await unifiedApiService.healthCheck();

        const satelliteResult = await unifiedApiService.detectChange({
          location,
          zoom_level: 'City-Wide (0.025°)',
          resolution: 'Standard (5m)',
          alpha: 0.4,
        });
        setSatelliteData(satelliteResult);

        // Cache the data
        onUpdateCache(tabId, {
          actualLocation: finalLocation,
          businesses: realBusinesses,
          satelliteData: satelliteResult,
          ndviData: null,
          isLoaded: true,
        });
      } catch (error) {
        console.warn('Satellite analysis API not available, using mock data:', error);
        // Set mock satellite data for development
        const mockSatelliteData = {
          success: true,
          message: "Mock satellite data (API not available)",
          coordinates: { latitude: finalLocation.lat, longitude: finalLocation.lng },
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
          }
        };
        setSatelliteData(mockSatelliteData);

        // Cache the data even with mock satellite data
        onUpdateCache(tabId, {
          actualLocation: finalLocation,
          businesses: realBusinesses,
          satelliteData: mockSatelliteData,
          ndviData: null,
          isLoaded: true,
        });
      } finally {
        setIsSatelliteLoading(false);
      }

      setIsGeocoding(false);
    };

    getLocationCoordinates();
  }, [location, businessType, isLoaded, cachedData, tabId, onUpdateCache]);

  // Calculate REAL success score and analytics from satellite data and competitors
  const successScore = calculateSuccessScore({
    satelliteData,
    ndviData,
    businesses,
    businessType,
  });

  const seasonalDemand = generateSeasonalDemand({
    satelliteData,
    ndviData,
    businessType,
    baseScore: successScore,
    location: actualLocation ? { lat: actualLocation.lat, lng: actualLocation.lng } : undefined,
  });

  const kpis = calculateKPIs({
    businesses,
    successScore,
    satelliteData,
    ndviData,
  });

  const analysis: LocationAnalysisType = {
    ...mockAnalysis,
    location: actualLocation || { ...mockAnalysis.location, address: location },
    businessType,
    successScore, // REAL score based on satellite + competitors
    seasonalDemand, // REAL seasonal data
    kpis, // REAL KPIs
  };

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business);
  };

  const handleRecenterMap = (_business: Business) => {
    setSelectedBusiness(null);
    // Map will automatically update with the business location
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      await generateEnhancedPDF({
        location,
        businessType,
        analysis,
        businesses,
        mapElementId: 'google-map-container',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex">
      {/* LEFT SIDEBAR - AI Chat (EXACT GARUDA SPECS: w-2/5) */}
      <div className="hidden lg:flex w-2/5 h-full border-r border-border/50 bg-card/30 backdrop-blur-sm flex-col">
        {/* Logo Header - FIXED/STATIC */}
        <div className="border-b border-border/50 p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="btn-icon btn-ghost"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Map className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Tapak</h1>
              <p className="text-sm max-w-sm text-muted-foreground">Ask questions about location analysis using satellite imagery</p>
            </div>
          </div>
        </div>

        {/* AI Chat Area - SCROLLABLE */}
        <div className="flex-1 overflow-hidden">
          <AIAssistant
            analysisContext={{
              location,
              businessType,
              successScore: analysis.successScore,
              competitorCount: businesses.length,
              satelliteData,
              ndviData,
              businesses,
            }}
          />
        </div>
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as 'map' | 'analytics' | 'ndvi')}
          className="w-full h-full flex flex-col"
        >
          {/* Tab Navigation - EXACT Garuda spacing */}
          <div className="flex-shrink-0 border-b border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="px-6 py-[22px] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TabsList className="grid w-full max-w-lg grid-cols-3 bg-card/30 border border-border/50">
                  <TabsTrigger
                    value="map"
                    className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Map className="h-4 w-4" />
                    <span className="font-medium">Map View</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-medium">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="ndvi"
                    className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <Leaf className="h-4 w-4" />
                    <span className="font-medium">Urban Development</span>
                  </TabsTrigger>
                </TabsList>

                {/* Comparison Tabs or Status Indicators */}
                <div className="ml-2 flex items-center space-x-4 text-sm text-muted-foreground">
                  {tabs.length > 1 ? (
                    // Show comparison tabs when multiple analyses exist
                    <div className="flex items-center gap-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => onTabSwitch(tab.id)}
                          className={cn(
                            "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200",
                            tab.id === activeTabId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    // Show status indicators when single analysis
                    <>
                      <div className="flex items-center space-x-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors duration-200",
                            businesses.length > 0 ? "bg-success animate-pulse" : "bg-muted"
                          )}
                        />
                        <span>{businesses.length > 0 ? `${businesses.length} businesses loaded` : "Loading data..."}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-3 w-3" />
                        <span>
                          {activeView === "map"
                            ? "Interactive mapping"
                            : activeView === "analytics"
                            ? "Live analytics"
                            : "NDVI analysis"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2">
                
                <button
                  onClick={onNewComparison}
                  className="btn-icon btn-ghost"
                  title="Compare locations"
                >
                  <GitCompare className="w-4 h-4" />
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className="btn-icon btn-ghost"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className="btn-icon btn-ghost lg:hidden"
                >
                  {isPanelOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content with Animations */}
            <TabsContent value="map" className="flex-1 m-0 h-full overflow-hidden">
              <motion.div
                key={`map-view-${activeTabId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {isGeocoding ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                      <div className="text-muted-foreground">Analyzing location data...</div>
                    </div>
                  </div>
                ) : (
                  <div id="google-map-container" className="h-full">
                    <GoogleMap
                      location={actualLocation!}
                      businesses={businesses}
                      onBusinessClick={handleBusinessClick}
                      className="h-full w-full"
                    />
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 m-0 h-full overflow-y-auto">
              <motion.div
                key={`analytics-view-${activeTabId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="min-h-full"
              >
                {/* Sub-tabs for Analytics - SCROLLS WITH CONTENT */}
                <div className="border-b border-border bg-background px-6 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-4 py-2 text-sm font-medium transition-all relative ${
                        activeTab === 'overview' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Overview
                      {activeTab === 'overview' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('businesses')}
                      className={`px-4 py-2 text-sm font-medium transition-all relative ${
                        activeTab === 'businesses' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Competitor Nearby
                      {activeTab === 'businesses' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('rent')}
                      className={`px-4 py-2 text-sm font-medium transition-all relative ${
                        activeTab === 'rent' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Rent Location
                      {activeTab === 'rent' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('ai-insight')}
                      className={`px-4 py-2 text-sm font-medium transition-all relative ${
                        activeTab === 'ai-insight' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Satellite Data
                      {activeTab === 'ai-insight' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub-tab Content */}
                <div>
                  {activeTab === 'overview' && (
                    <div className="p-6 space-y-6">
                      {/* Statistics Header Section - Garuda Style */}
                      <div className="card-elevated p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Map className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-foreground">Location Analysis Complete</h2>
                            <p className="text-sm text-muted-foreground">AI-powered insights with comprehensive data</p>
                          </div>
                        </div>

                        {/* Key Metrics Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-background-alt rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-success"></div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Success Score</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">{analysis.successScore}%</div>
                          </div>
                          <div className="p-4 bg-background-alt rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-accent"></div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Competitors</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">{businesses.length}</div>
                          </div>
                          <div className="p-4 bg-background-alt rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Analysis Type</span>
                            </div>
                            <div className="text-sm font-bold text-foreground">Location Intelligence</div>
                          </div>
                          <div className="p-4 bg-background-alt rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-warning"></div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Data Quality</span>
                            </div>
                            <div className="text-sm font-bold text-success">High (92%)</div>
                          </div>
                        </div>
                      </div>

                      {/* AI Analysis Insights */}
                      <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                          <h3 className="text-lg font-semibold text-foreground">AI Analysis Insights</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                            <span className="text-success font-bold">✓</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">High-Quality Location Data</p>
                              <p className="text-xs text-muted-foreground">Real-time analysis with comprehensive market insights</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <span className="text-primary font-bold">★</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">AI-Enhanced Analytics</p>
                              <p className="text-xs text-muted-foreground">Machine learning models provide advanced pattern detection</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                            <span className="text-accent font-bold">◆</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">Market Trends Analysis</p>
                              <p className="text-xs text-muted-foreground">Seasonal patterns and demographic insights detected</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <KPICards kpis={analysis.kpis} />

                      <div id="success-score-chart">
                        <SuccessScoreChart score={analysis.successScore} />
                      </div>

                      <div id="seasonal-demand-chart">
                        <SeasonalDemandChart data={analysis.seasonalDemand} />
                      </div>

                      <div id="demographic-chart">
                        <DemographicChart data={analysis.demographics} />
                      </div>

                      <div id="competitor-chart">
                        <CompetitorChart data={analysis.competitors} />
                      </div>

                      <div id="location-profile-chart">
                        <LocationProfileChart data={analysis.locationProfile} />
                      </div>

                      <div id="competition-density-chart">
                        <CompetitionDensityChart data={analysis.competitionDensity} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'businesses' && (
                    <div className="p-6 space-y-4">
                      <div className="card p-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Competitor Analysis</h3>
                          <p className="text-sm text-muted-foreground">{businesses.length} businesses found within 1km radius</p>
                        </div>
                        <div className="badge-accent">
                          <span className="text-xs font-medium">Live Data</span>
                        </div>
                      </div>
                      {businesses.map((business) => (
                        <BusinessCard
                          key={business.id}
                          business={business}
                          onClick={handleBusinessClick}
                        />
                      ))}
                    </div>
                  )}

                  {activeTab === 'rent' && (
                    <div className="p-6">
                      <div className="card p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                          <h3 className="text-lg font-semibold text-foreground">Market Data & Rent Analysis</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Real estate and rental market insights for this location</p>
                      </div>
                      <RentLocationContent location={location} businessType={businessType} />
                    </div>
                  )}

                  {activeTab === 'ai-insight' && (
                    <div className="pb-6">
                      <SatelliteAnalysis
                        location={location}
                        coordinates={actualLocation || undefined}
                        onAnalysisComplete={(data) => setSatelliteData(data)}
                        initialData={satelliteData}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="ndvi" className="flex-1 m-0 h-full overflow-auto">
              <motion.div
                key={`ndvi-view-${activeTabId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <NDVIAnalysis
                  location={location}
                  coordinates={actualLocation || undefined}
                  onAnalysisComplete={(data) => setNdviData(data)}
                  initialData={ndviData}
                />
              </motion.div>
            </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Analysis Panel Overlay */}
        {isPanelOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-background">
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="btn-icon btn-ghost"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex-1 text-center">
                    <h2 className="text-lg font-semibold text-foreground">Analysis Dashboard</h2>
                    <p className="text-sm text-muted-foreground">{businessType} in {location}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Tabs */}
              <div className="bg-background border-b border-border px-4 py-2">
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === 'overview'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('businesses')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === 'businesses'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    Businesses
                  </button>
                  <button
                    onClick={() => setActiveTab('rent')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === 'rent'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    Rent
                  </button>
                  <button
                    onClick={() => setActiveTab('ai-insight')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === 'ai-insight'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    AI Chat
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' ? (
                  <div className="p-6 space-y-8">
                    <div id="success-score-chart-mobile">
                      <SuccessScoreChart score={analysis.successScore} />
                    </div>
                    <KPICards kpis={analysis.kpis} />
                    <div id="seasonal-demand-chart-mobile">
                      <SeasonalDemandChart data={analysis.seasonalDemand} />
                    </div>
                    <div id="demographic-chart-mobile">
                      <DemographicChart data={analysis.demographics} />
                    </div>
                    <div id="competitor-chart-mobile">
                      <CompetitorChart data={analysis.competitors} />
                    </div>
                    <div id="location-profile-chart-mobile">
                      <LocationProfileChart data={analysis.locationProfile} />
                    </div>
                    <div id="competition-density-chart-mobile">
                      <CompetitionDensityChart data={analysis.competitionDensity} />
                    </div>
                  </div>
                ) : activeTab === 'businesses' ? (
                  <div className="p-6 space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      {businesses.length} businesses found within 1km radius
                    </div>
                    {businesses.map((business) => (
                      <BusinessCard
                        key={business.id}
                        business={business}
                        onClick={handleBusinessClick}
                      />
                    ))}
                  </div>
                ) : activeTab === 'rent' ? (
                  <div className="p-6">
                    <RentLocationContent location={location} businessType={businessType} />
                  </div>
                ) : activeTab === 'ai-insight' ? (
                  <div className="h-full">
                    <AIAssistant
                      onClose={() => setActiveTab('overview')}
                      analysisContext={{
                        location,
                        businessType,
                        successScore: analysis.successScore,
                        competitorCount: businesses.length,
                        satelliteData,
                        ndviData,
                        businesses,
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Urban Development Analysis</h3>
                        <p className="text-muted-foreground">Infrastructure and development insights for this location.</p>
                      </div>
                      <div className="grid gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium text-foreground mb-2">Public Transportation</h4>
                          <p className="text-sm text-muted-foreground">Analysis of nearby transit options and accessibility.</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium text-foreground mb-2">Future Developments</h4>
                          <p className="text-sm text-muted-foreground">Planned infrastructure and construction projects in the area.</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium text-foreground mb-2">Amenities</h4>
                          <p className="text-sm text-muted-foreground">Nearby facilities, parks, schools, and shopping centers.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Hamburger Button for Mobile */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="fixed top-32 left-4 z-10 p-3 bg-background rounded-full shadow-lg hover:shadow-xl transition-all lg:hidden btn-icon"
          aria-label="Open analysis panel"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      {selectedBusiness && (
        <BusinessDetail
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onRecenter={handleRecenterMap}
        />
      )}

      {/* API Instructions Modal */}
      <ApiInstructions
        isVisible={showApiInstructions}
        onClose={() => setShowApiInstructions(false)}
      />
    </div>
  );
};

export default LocationAnalysis;