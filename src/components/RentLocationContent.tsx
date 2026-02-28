import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Building, Calculator, Info, Star, Users, Clock, Loader2 } from 'lucide-react';
import { scrapeRentalData, RentalProperty } from '../services/rentalScraper';

interface RentLocationContentProps {
  location: string;
  businessType: string;
}

const RentLocationContent: React.FC<RentLocationContentProps> = ({ location, businessType }) => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [spaceSize, setSpaceSize] = useState<number>(1000);
  const [rentPerSqFt, setRentPerSqFt] = useState<number>(15.5);
  const [calculatedRent, setCalculatedRent] = useState<number>(15500);
  const [isLoadingRent, setIsLoadingRent] = useState(true);
  const [rentSource, setRentSource] = useState<'scraped' | 'fallback'>('fallback');

  // Hardcoded fallback data
  const fallbackRentData = {
    averageRent: 15.50,
    priceRange: { min: 12, max: 22 },
    currency: 'RM',
    unit: 'per sq ft/month',
    marketTrend: 'increasing',
    trendPercentage: 8.5,
  };

  const fallbackProperties: RentalProperty[] = [
    {
      id: '1', name: 'Avenue K Restaurant Lot',
      address: 'Level G, Avenue K Mall, Jalan Ampang, Kuala Lumpur',
      rent: 25.00, size: 1100, type: 'Restaurant Space', availability: 'Available Now',
      rating: 4.6, amenities: ['High Foot Traffic', 'Mall Security', 'Grease Trap Installed', 'Air Conditioning'],
      contact: '+60 3-2168 7888',
      image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: '2', name: 'Suria KLCC F&B Corner Lot',
      address: 'Lot C.12, Level Concourse, Suria KLCC',
      rent: 28.50, size: 900, type: 'Restaurant Space', availability: 'Available in 3 weeks',
      rating: 4.9, amenities: ['High Foot Traffic', 'Kitchen Exhaust Ready', 'Mall Security', 'Utilities Included'],
      contact: '+60 3-2382 2828',
      image: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: '3', name: 'The LINC KL Dining Lot',
      address: '360 Jalan Tun Razak, Ground Floor, Kuala Lumpur',
      rent: 20.75, size: 1000, type: 'Restaurant Space', availability: 'Available Now',
      rating: 4.4, amenities: ['Open Concept Layout', 'Ample Parking', 'Grease Trap Installed', 'Flexible Kitchen Setup'],
      contact: '+60 3-2730 1188',
      image: 'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  const [rentData, setRentData] = useState(fallbackRentData);
  const [properties, setProperties] = useState<RentalProperty[]>(fallbackProperties);

  // Attempt to scrape real rental data
  useEffect(() => {
    const loadRentalData = async () => {
      setIsLoadingRent(true);
      try {
        const scraped = await scrapeRentalData(location, businessType);
        if (scraped && scraped.properties.length > 0) {
          setRentData({
            averageRent: scraped.averageRent,
            priceRange: scraped.priceRange,
            currency: scraped.currency,
            unit: scraped.unit,
            marketTrend: scraped.marketTrend,
            trendPercentage: scraped.trendPercentage,
          });
          setProperties(scraped.properties);
          setRentPerSqFt(scraped.averageRent);
          setRentSource('scraped');
          console.log('✅ Using real scraped rental data');
        } else {
          console.log('ℹ️ Using fallback rental data');
          setRentSource('fallback');
        }
      } catch (error) {
        console.warn('Scraping failed, using fallback data:', error);
        setRentSource('fallback');
      } finally {
        setIsLoadingRent(false);
      }
    };

    loadRentalData();
  }, [location, businessType]);

  const calculateMonthlyRent = (rentPerSqFt: number, size: number) => {
    return (rentPerSqFt * size).toLocaleString();
  };

  const handleCalculate = () => {
    setCalculatedRent(spaceSize * rentPerSqFt);
  };

  const getRentColor = (rent: number) => {
    if (rent <= 15) return 'text-success';
    if (rent <= 18) return 'text-warning';
    return 'text-destructive';
  };

  const getRentBadgeColor = (rent: number) => {
    if (rent <= 15) return 'badge-success';
    if (rent <= 18) return 'badge-warning';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Loading state */}
      {isLoadingRent && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Searching for rental properties near {location}...</span>
        </div>
      )}

      {/* Market Overview */}
      <div className="bg-card text-foreground rounded-xl p-6 shadow-lg border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Building className="w-6 h-6" />
            Rental Market Overview
          </h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rentSource === 'scraped'
            ? 'bg-success/20 text-success border border-success/30'
            : 'bg-warning/20 text-warning border border-warning/30'
            }`}>
            {rentSource === 'scraped' ? '🔴 Live Data' : '📋 Sample Data'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-2xl font-bold">
              {rentData.currency} {rentData.averageRent}
            </div>
            <div className="text-muted-foreground text-sm">Average Rent ({rentData.unit})</div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-2xl font-bold">
              {rentData.currency} {rentData.priceRange.min} - {rentData.priceRange.max}
            </div>
            <div className="text-muted-foreground text-sm">Price Range ({rentData.unit})</div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <div className="text-2xl font-bold">+{rentData.trendPercentage}%</div>
            </div>
            <div className="text-muted-foreground text-sm">Market Trend (YoY)</div>
          </div>
        </div>
      </div>

      {/* Rent Calculator */}
      <div className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-border animate-fade-in">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
          <Calculator className="w-5 h-5 text-primary" />
          Quick Rent Calculator
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Space Size (sq ft)
            </label>
            <input
              type="number"
              value={spaceSize}
              onChange={(e) => setSpaceSize(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">
              Rent per sq ft (RM)
            </label>
            <input
              type="number"
              value={rentPerSqFt}
              onChange={(e) => setRentPerSqFt(Number(e.target.value))}
              step="0.50"
              className="input"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleCalculate}
            className="btn-primary"
          >
            <Calculator className="w-4 h-4" />
            Calculate
          </button>
          <div className="flex-1 p-4 bg-muted rounded-lg border border-border">
            <div className="text-sm text-muted-foreground mb-1">Estimated Monthly Rent</div>
            <div className="text-2xl font-bold text-foreground">
              RM {calculatedRent.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Available Properties */}
      <div className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-border animate-fade-in">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
          <MapPin className="w-5 h-5 text-primary" />
          Available Properties Near {location}
        </h4>
        <div className="space-y-4">
          {properties.map((property) => (
            <div
              key={property.id}
              className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${selectedProperty === property.id
                ? 'border-primary bg-primary-light'
                : 'border-card-border hover:border-primary/30'
                }`}
              onClick={() => setSelectedProperty(selectedProperty === property.id ? null : property.id)}
            >
              <div className="flex gap-4">
                <img
                  src={property.image}
                  alt={property.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-foreground truncate text-base">{property.name}</h5>
                    <span className={`badge px-2.5 py-1 rounded-full text-xs font-semibold ${getRentBadgeColor(property.rent)}`}>
                      RM {property.rent}/sq ft
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(property.rating)
                            ? 'fill-warning text-warning'
                            : 'text-border'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">{property.rating}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{property.type}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{property.address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {property.size.toLocaleString()} sq ft
                      </span>
                      <span className={`font-semibold ${getRentColor(property.rent)}`}>
                        RM {calculateMonthlyRent(property.rent, property.size)}/month
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {property.availability}
                    </div>
                  </div>
                </div>
              </div>

              {selectedProperty === property.id && (
                <div className="mt-4 pt-4 border-t border-card-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="font-semibold text-foreground mb-2 text-sm">Amenities</h6>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 bg-muted text-foreground rounded-full text-xs font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h6 className="font-semibold text-foreground mb-2 text-sm">Contact Information</h6>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {property.contact}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="flex-1 btn-primary text-sm">
                      Contact Owner
                    </button>
                    <button className="flex-1 btn-secondary text-sm">
                      Schedule Visit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-border animate-fade-in">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
          <Info className="w-5 h-5 text-primary" />
          Market Insights for {businessType}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-foreground mb-3">Rental Trends</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Prime locations (KLCC area) command 20-30% premium</li>
              <li>• Ground floor retail spaces are 15% more expensive</li>
              <li>• Flexible lease terms available for new businesses</li>
              <li>• Average lease duration: 3-5 years</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-3">Location Benefits</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• High foot traffic from office workers and tourists</li>
              <li>• Excellent public transportation connectivity</li>
              <li>• Premium shopping and dining district</li>
              <li>• Strong brand association with luxury market</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentLocationContent;