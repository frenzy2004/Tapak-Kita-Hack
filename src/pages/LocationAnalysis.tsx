import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, Map, BarChart3, Leaf, Activity, GitCompare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// Components
import GoogleMap from '../components/GoogleMap';
import SeasonalDemandChart from '../components/charts/SeasonalDemandChart';
import DemographicChart from '../components/charts/DemographicChart';
import CompetitorChart from '../components/charts/CompetitorChart';
import SuccessScoreChart from '../components/charts/SuccessScoreChart';
import BusinessCard from '../components/BusinessCard';
import KPICards from '../components/KPICards';
import RentLocationContent from '../components/RentLocationContent';
import SatelliteAnalysis from '../components/SatelliteAnalysis';
import NDVIAnalysis from '../components/NDVIAnalysis';
import ApiInstructions from '../components/ApiInstructions';
import { ClayBackground } from '../components/ClayBackground';
import FloatingAI from '../components/FloatingAI'; // NEW
import PreviewCard from '../components/PreviewCard'; // NEW
import VantaBackground from '../components/VantaBackground'; // NEW

// Types and Utils
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
  activeTabId,
  onNewComparison,
  cachedData,
  onUpdateCache,
}) => {
  // --- State ---
  const [viewMode, setViewMode] = useState<'dashboard' | 'map' | 'analytics' | 'ndvi'>('dashboard');

  // Analytics sub-tabs state (for full view)
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'overview' | 'businesses' | 'rent'>('overview');

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [actualLocation, setActualLocation] = useState<Location | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [satelliteData, setSatelliteData] = useState<ChangeDetectionResponse | null>(null);
  const [ndviData, setNdviData] = useState<NDVIAnalysisResponse | null>(null);
  const [showApiInstructions, setShowApiInstructions] = useState(false);

  const { isLoaded } = useGoogleMaps();

  // --- Data Fetching ---
  useEffect(() => {
    if (cachedData?.isLoaded) {
      setActualLocation(cachedData.actualLocation);
      setBusinesses(cachedData.businesses);
      setSatelliteData(cachedData.satelliteData);
      setNdviData(cachedData.ndviData);
      setIsGeocoding(false);
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
        finalLocation = { ...mockAnalysis.location, address: location };
      }

      setActualLocation(finalLocation);

      // Find real businesses
      const realBusinesses = await findNearbyBusinesses(finalLocation, businessType);
      setBusinesses(realBusinesses);

      // Load satellite data
      try {
        await unifiedApiService.healthCheck();
        const satelliteResult = await unifiedApiService.detectChange({
          location,
          zoom_level: 'City-Wide (0.025°)',
          resolution: 'Standard (5m)',
          alpha: 0.4,
        });
        setSatelliteData(satelliteResult);

        onUpdateCache(tabId, {
          actualLocation: finalLocation,
          businesses: realBusinesses,
          satelliteData: satelliteResult,
          ndviData: null,
          isLoaded: true,
        });
      } catch (error) {
        console.warn('Satellite analysis API not available, using mock data:', error);
        const mockSatelliteData = {
          success: true,
          message: "Mock satellite data (API not available)",
          coordinates: { latitude: finalLocation.lat, longitude: finalLocation.lng },
          dates: { before: "2017-04-10", after: "2025-04-28" },
          statistics: { changed_pixels: 1250, total_pixels: 10000, change_percentage: 12.5 },
          images: { before: "", after: "", mask: "", overlay: "" }
        };
        setSatelliteData(mockSatelliteData);

        onUpdateCache(tabId, {
          actualLocation: finalLocation,
          businesses: realBusinesses,
          satelliteData: mockSatelliteData,
          ndviData: null,
          isLoaded: true,
        });
      }

      setIsGeocoding(false);
    };

    getLocationCoordinates();
  }, [location, businessType, isLoaded, cachedData, tabId, onUpdateCache]);

  // --- Analytics Calculation ---
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
    successScore,
    seasonalDemand,
    kpis,
  };

  // --- Handlers ---
  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business);
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

  // --- Helper Renders for Dashboard ---

  const renderInitializingState = (message: string) => (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] shadow-clayButton flex items-center justify-center animate-clay-breathe relative z-10">
          <Activity className="w-6 h-6 text-white drop-shadow-md animate-bounce" />
        </div>
      </div>
      <div className="text-lg font-heading font-black text-clay-foreground tracking-tight">
        {message}
      </div>
      <div className="mt-1 text-sm text-clay-muted font-body font-medium animate-pulse">
        Fetching data...
      </div>
    </div>
  );

  return (
    <VantaBackground className="h-screen w-screen bg-background text-foreground font-body flex flex-col overflow-hidden relative">
      {/* Floating AI Assistant (Always available) */}
      <FloatingAI
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

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === 'dashboard' ? (
          /* ================= DASHBOARD VIEW ================= */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="flex-1 p-6 lg:p-8 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 max-w-[1600px] mx-auto w-full">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="btn-icon bg-white text-foreground hover:text-primary transition-colors border border-border shadow-sm"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-3">
                    {location}
                    <span className="text-lg font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
                      {businessType}
                    </span>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Tapak Intelligence Dashboard</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onNewComparison}
                  className="btn-secondary flex items-center gap-2"
                >
                  <GitCompare className="w-4 h-4" />
                  Compare
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Exporting...' : 'Export Report'}
                </button>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1600px] mx-auto w-full h-[calc(100vh-180px)] min-h-[600px]">

              {/* 1. Map Card (Large, Left) */}
              <div className="lg:col-span-2 h-full">
                <PreviewCard
                  title="Location Intelligence"
                  subtitle={`${businesses.length} competitors detected in area`}
                  icon={Map}
                  onClick={() => setViewMode('map')}
                  className="h-full"
                >
                  {isGeocoding ? (
                    renderInitializingState("Locating...")
                  ) : (
                    <div className="w-full h-full rounded-xl overflow-hidden pointer-events-none relative group-hover:scale-[1.02] transition-transform duration-700">
                      {actualLocation && (
                        <GoogleMap
                          location={actualLocation}
                          businesses={businesses}
                          onBusinessClick={() => { }} // Disabled in preview
                          className="w-full h-full"
                        // Simplified map style could be passed here if supported
                        />
                      )}
                      {/* Overlay to prevent interaction and indicate clickable */}
                      <div className="absolute inset-0 bg-transparent z-10" />
                    </div>
                  )}
                </PreviewCard>
              </div>

              {/* Right Column Stack */}
              <div className="flex flex-col gap-6 h-full">

                {/* 2. Data Card (Top Right) */}
                <div className="flex-1">
                  <PreviewCard
                    title="Market Data"
                    subtitle={`Success Score: ${successScore}%`}
                    icon={BarChart3}
                    onClick={() => setViewMode('analytics')}
                    className="h-full"
                  >
                    <div className="p-2 h-full flex flex-col justify-center gap-4">
                      <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Predicted Success</span>
                          <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">High Confidence</span>
                        </div>
                        <div className="text-4xl font-heading font-bold text-foreground">{successScore}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${successScore}%` }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/30 p-3 rounded-xl">
                          <div className="text-xs text-muted-foreground">Avg Rent</div>
                          <div className="text-lg font-bold text-foreground">RM 15.5</div>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-xl">
                          <div className="text-xs text-muted-foreground">Demand</div>
                          <div className="text-lg font-bold text-foreground">High</div>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </div>

                {/* 3. Urban Card (Bottom Right) */}
                <div className="flex-1">
                  <PreviewCard
                    title="Urban Analysis"
                    subtitle="Satellite & NDVI Insights"
                    icon={Leaf}
                    onClick={() => setViewMode('ndvi')}
                    className="h-full"
                  >
                    {satelliteData ? (
                      <div className="h-full p-2 flex flex-col justify-center">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Vegetation</div>
                            <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                              +24.1% <TrendingIcon value={24.1} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Urban Growth</div>
                            <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                              -20.4% <TrendingIcon value={-20.4} />
                            </div>
                          </div>
                          <div className="col-span-2 bg-muted/30 p-3 rounded-lg mt-2">
                            <p className="text-xs text-muted-foreground italic">
                              "Significant vegetation increase improves air quality..."
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      renderInitializingState("Analyzing Terrain...")
                    )}
                  </PreviewCard>
                </div>

              </div>
            </div>
          </motion.div>
        ) : (
          /* ================= FULL SCREEN VIEWS ================= */
          <motion.div
            key="full-view"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col h-full bg-background relative"
          >
            {/* Back Navigation Bar */}
            <div className="bg-white/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between z-30 sticky top-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="p-1.5 rounded-full bg-muted group-hover:bg-muted/80 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  Back to Dashboard
                </button>
                <div className="h-4 w-[1px] bg-border mx-2" />
                <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                  {viewMode === 'map' && <><Map className="w-5 h-5 text-primary" /> Map View</>}
                  {viewMode === 'analytics' && <><BarChart3 className="w-5 h-5 text-primary" /> Data Analytics</>}
                  {viewMode === 'ndvi' && <><Leaf className="w-5 h-5 text-primary" /> Urban Analysis</>}
                </h2>
              </div>

              {/* Controls specific to view */}
              {viewMode === 'analytics' && (
                <div className="flex bg-muted/50 p-1 rounded-lg">
                  {['overview', 'businesses', 'rent'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveAnalyticsTab(tab as any)}
                      className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeAnalyticsTab === tab ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Content */}
            <div className="flex-1 overflow-hidden relative">
              {viewMode === 'map' && (
                <div className="w-full h-full relative">
                  <GoogleMap
                    location={actualLocation!}
                    businesses={businesses}
                    onBusinessClick={handleBusinessClick}
                    className="w-full h-full"
                  />
                  {/* Map Context Overlay could go here */}
                </div>
              )}

              {viewMode === 'analytics' && (
                <div className="w-full h-full overflow-y-auto p-6 lg:p-10">
                  <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                    {/* Reuse existing analytics render logic */}
                    {activeAnalyticsTab === 'overview' && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="card-elevated p-6 flex flex-col items-center justify-center text-center">
                            <div className="text-sm text-muted-foreground mb-1">Success Score</div>
                            <div className="text-5xl font-black text-primary">{successScore}%</div>
                          </div>
                          {/* KPIS */}
                        </div>
                        <KPICards kpis={analysis.kpis} />
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="card bg-white"><SuccessScoreChart score={analysis.successScore} /></div>
                          <div className="card bg-white"><CompetitorChart data={analysis.competitors} /></div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="card bg-white"><SeasonalDemandChart data={analysis.seasonalDemand} /></div>
                          <div className="card bg-white"><DemographicChart data={analysis.demographics} /></div>
                        </div>
                      </div>
                    )}

                    {activeAnalyticsTab === 'businesses' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {businesses.map((b) => (
                          <BusinessCard key={b.id} business={b} onClick={handleBusinessClick} />
                        ))}
                      </div>
                    )}

                    {activeAnalyticsTab === 'rent' && (
                      <RentLocationContent location={location} businessType={businessType} />
                    )}
                  </div>
                </div>
              )}

              {viewMode === 'ndvi' && (
                <div className="w-full h-full overflow-y-auto p-6 lg:p-10">
                  <div className="max-w-5xl mx-auto space-y-8">
                    <SatelliteAnalysis
                      location={location}
                      coordinates={actualLocation || undefined}
                      onAnalysisComplete={setSatelliteData}
                      initialData={satelliteData}
                    />
                    <hr className="border-border/50" />
                    <NDVIAnalysis
                      location={location}
                      coordinates={actualLocation || undefined}
                      onAnalysisComplete={setNdviData}
                      initialData={ndviData}
                    />
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <ApiInstructions
        isVisible={showApiInstructions}
        onClose={() => setShowApiInstructions(false)}
      />
    </VantaBackground>
  );
};

// Tiny helper for the trending icon
const TrendingIcon = ({ value }: { value: number }) => {
  if (value > 0) return <span className="text-green-500 text-xs">▲</span>;
  if (value < 0) return <span className="text-red-500 text-xs">▼</span>;
  return <span className="text-gray-500 text-xs">-</span>;
};

export default LocationAnalysis;