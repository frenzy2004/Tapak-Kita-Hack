import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Globe } from '../components/ui/globe';
import { ClayBackground } from '../components/ClayBackground';

interface LocationRequestProps {
  onSubmit: (location: string, businessType: string) => void;
}

const LocationRequest: React.FC<LocationRequestProps> = ({ onSubmit }) => {
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessScale, setBusinessScale] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteService = useRef<any | null>(null);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);

    if (value.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          types: ['establishment', 'geocode']
        },
        (predictions: any, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5));
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setLocation(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const businessTypes = [
    'Restaurant',
    'Cafe',
    'Retail Store',
    'Office Space',
    'Gym/Fitness',
    'Beauty Salon',
    'Medical Clinic',
    'Educational Center',
    'Entertainment Venue',
    'Service Business',
  ];

  const businessScales = [
    'SME',
    'Franchise',
    'Corporate'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim() && businessType) {
      onSubmit(location.trim(), businessType);
    }
  };

  const isFormValid = location.trim() && businessType && businessScale;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-8 py-16 relative overflow-hidden bg-background">
      <ClayBackground />

      {/* Interactive Globe Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <Globe className="opacity-40 scale-150 sm:scale-125 translate-y-32" />
      </div>

      <div className="w-full max-w-7xl animate-fade-in relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center space-y-6 mb-16 relative">
          <div className="flex flex-col items-center justify-center mb-4">
            {/* Icon Orb */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-clayButton flex items-center justify-center animate-clay-breathe">
                <MapPin className="w-10 h-10 text-white drop-shadow-md" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-heading font-black text-clay-foreground tracking-tighter leading-[0.9]">
              <span className="clay-text-gradient">Tapak</span>
            </h1>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl text-clay-muted font-bold font-heading max-w-2xl mx-auto">
            Let's find your perfect spot.
          </p>
        </div>

        {/* Horizontal Form Container */}
        <div className="w-full max-w-6xl">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/40 backdrop-blur-xl p-4 sm:p-6 rounded-[40px] shadow-clayCard border border-white/60">

              {/* Location Input Group */}
              <div className="lg:col-span-5 relative group">
                <label className="sr-only" htmlFor="location">Location</label>
                <div className="relative">
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={handleLocationChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="e.g., near LRT KLCC"
                    className="pl-14 h-20 text-xl shadow-clayPressed bg-[#EFEBF5] border-transparent focus:bg-white transition-all"
                    required
                  />
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary pointer-events-none opacity-70" />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-4 bg-white/90 backdrop-blur-md border border-white/50 rounded-3xl shadow-clayCardHover max-h-80 overflow-y-auto p-2 animate-fade-in">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-6 py-4 hover:bg-primary/5 hover:text-primary transition-colors rounded-2xl flex items-start gap-3 group/item"
                      >
                        <MapPin className="w-5 h-5 text-gray-400 group-hover/item:text-primary mt-1 flex-shrink-0 transition-colors" />
                        <div>
                          <div className="font-bold text-lg text-clay-foreground font-heading">
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-sm text-clay-muted font-body">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Business Type */}
              <div className="lg:col-span-3 relative">
                <div className="relative h-full">
                  <select
                    id="business-type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full h-20 pl-6 pr-12 appearance-none rounded-2xl border-0 bg-[#EFEBF5] text-lg text-clay-foreground shadow-clayPressed ring-offset-background placeholder:text-clay-muted focus:bg-white focus:shadow-none focus:ring-4 focus:ring-clay-accent/20 focus-visible:outline-none transition-all duration-200 font-body cursor-pointer"
                    required
                  >
                    <option value="" className="text-muted-foreground">Type</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary pointer-events-none opacity-70" />
                </div>
              </div>

              {/* Business Scale */}
              <div className="lg:col-span-2 relative">
                <div className="relative h-full">
                  <select
                    id="business-scale"
                    value={businessScale}
                    onChange={(e) => setBusinessScale(e.target.value)}
                    className="w-full h-20 pl-6 pr-12 appearance-none rounded-2xl border-0 bg-[#EFEBF5] text-lg text-clay-foreground shadow-clayPressed ring-offset-background placeholder:text-clay-muted focus:bg-white focus:shadow-none focus:ring-4 focus:ring-clay-accent/20 focus-visible:outline-none transition-all duration-200 font-body cursor-pointer"
                    required
                  >
                    <option value="" className="text-muted-foreground">Scale</option>
                    {businessScales.map((scale) => (
                      <option key={scale} value={scale}>
                        {scale}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary pointer-events-none opacity-70" />
                </div>
              </div>

              {/* Submit Button */}
              <div className="lg:col-span-2">
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full h-20 text-lg rounded-2xl"
                  variant="default"
                >
                  Analyze
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationRequest;