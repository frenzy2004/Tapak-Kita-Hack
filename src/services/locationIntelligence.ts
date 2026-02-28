import { Location, Business } from '../types';

declare global {
    interface Window {
        google: any;
    }
}

// ============================================================
// Types for derived analytics
// ============================================================

export interface CompetitionDensity {
    radius: string;
    category: string;
    density: number;
}

export interface Demographics {
    office: number;
    residents: number;
}

export interface LocationProfile {
    age: number;
    income: number;
    familySize: number;
    daytimePop: number;
    accessibility: number;
}

export interface CompetitorChartEntry {
    name: string;
    size: number;
    rating: number;
    distance: number;
}

export interface LocationIntelligenceData {
    competitionDensity: CompetitionDensity[];
    demographics: Demographics;
    locationProfile: LocationProfile;
    competitors: CompetitorChartEntry[];
}

// ============================================================
// Place type classifications
// ============================================================

const OFFICE_TYPES = [
    'accounting', 'lawyer', 'insurance_agency', 'real_estate_agency',
    'finance', 'bank', 'atm', 'local_government_office',
    'travel_agency', 'car_rental', 'moving_company',
];

const RESIDENTIAL_TYPES = [
    'school', 'supermarket', 'laundry', 'pharmacy', 'park',
    'veterinary_care', 'pet_store', 'grocery_or_supermarket',
    'convenience_store', 'bakery',
];

const TRANSIT_TYPES = [
    'transit_station', 'bus_station', 'subway_station', 'train_station',
    'light_rail_station',
];

const YOUNG_DEMOGRAPHIC_TYPES = [
    'gym', 'night_club', 'bar', 'movie_theater', 'amusement_park',
    'bowling_alley', 'spa', 'beauty_salon',
];

const OLDER_DEMOGRAPHIC_TYPES = [
    'hospital', 'doctor', 'dentist', 'physiotherapist',
    'church', 'mosque', 'hindu_temple', 'synagogue',
];

const FAMILY_TYPES = [
    'school', 'primary_school', 'secondary_school', 'library',
    'zoo', 'aquarium', 'park',
];

const LUXURY_TYPES = [
    'jewelry_store', 'clothing_store', 'department_store',
    'shopping_mall', 'spa',
];

const BUDGET_TYPES = [
    'convenience_store', 'discount_store', 'pawn_shop',
    'meal_takeaway', 'laundry',
];

// ============================================================
// Helper: Google Places nearbySearch wrapper
// ============================================================

function nearbySearch(
    service: any,
    location: Location,
    radius: number,
    type?: string,
    keyword?: string,
): Promise<any[]> {
    return new Promise((resolve) => {
        const request: any = {
            location: { lat: location.lat, lng: location.lng },
            radius,
        };
        if (type) request.type = type;
        if (keyword) request.keyword = keyword;

        service.nearbySearch(request, (results: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
            } else {
                resolve([]);
            }
        });
    });
}

// ============================================================
// 1. Competition Density (multi-radius)
// ============================================================

async function getCompetitionDensity(
    service: any,
    location: Location,
    businessType: string,
): Promise<CompetitionDensity[]> {
    const radii = [
        { radius: 1000, label: '1km' },
        { radius: 3000, label: '3km' },
        { radius: 5000, label: '5km' },
    ];

    // Map business type to search categories
    const categoryMap: Record<string, string[]> = {
        'Restaurant': ['restaurant', 'cafe'],
        'Cafe': ['cafe', 'restaurant'],
        'Retail Store': ['store', 'shopping_mall'],
        'Office Space': ['real_estate_agency', 'office'],
        'Gym/Fitness': ['gym', 'health'],
        'Beauty Salon': ['beauty_salon', 'spa'],
        'Medical Clinic': ['doctor', 'hospital'],
        'Educational Center': ['school', 'university'],
        'Entertainment Venue': ['movie_theater', 'amusement_park'],
        'Service Business': ['establishment'],
    };

    const categories = categoryMap[businessType] || ['restaurant', 'cafe'];
    const results: CompetitionDensity[] = [];

    for (const { radius, label } of radii) {
        for (const category of categories) {
            const places = await nearbySearch(service, location, radius, category);
            // Deduplicate by place_id
            const uniquePlaces = places.filter(
                (p: any, i: number, arr: any[]) => i === arr.findIndex((x: any) => x.place_id === p.place_id)
            );
            const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
            results.push({
                radius: label,
                category: capitalizedCategory + 's',
                density: uniquePlaces.length,
            });
        }
    }

    return results;
}

// ============================================================
// 2. Demographics Estimation
// ============================================================

async function getDemographics(
    service: any,
    location: Location,
): Promise<Demographics> {
    // Search for office-type places
    let officeCount = 0;
    for (const type of OFFICE_TYPES.slice(0, 4)) { // Limit searches to save quota
        const places = await nearbySearch(service, location, 1000, type);
        officeCount += places.length;
    }

    // Search for residential-type places
    let residentialCount = 0;
    for (const type of RESIDENTIAL_TYPES.slice(0, 4)) {
        const places = await nearbySearch(service, location, 1000, type);
        residentialCount += places.length;
    }

    const total = officeCount + residentialCount;
    if (total === 0) {
        return { office: 50, residents: 50 };
    }

    const officePercent = Math.round((officeCount / total) * 100);
    const residentialPercent = 100 - officePercent;

    return { office: officePercent, residents: residentialPercent };
}

// ============================================================
// 3. Location Profile
// ============================================================

async function getLocationProfile(
    service: any,
    location: Location,
    businesses: Business[],
): Promise<LocationProfile> {
    // --- Accessibility: count transit stations nearby ---
    let transitCount = 0;
    for (const type of TRANSIT_TYPES.slice(0, 3)) {
        const places = await nearbySearch(service, location, 1500, type);
        transitCount += places.length;
    }
    const accessibility = Math.min(Math.round((transitCount / 8) * 100), 100);

    // --- Daytime Population: based on commercial/office density ---
    let commercialCount = 0;
    const commercialResults = await nearbySearch(service, location, 1000, undefined, 'office');
    commercialCount += commercialResults.length;
    const restaurantResults = await nearbySearch(service, location, 1000, 'restaurant');
    commercialCount += restaurantResults.length;
    const daytimePop = Math.min(Math.round((commercialCount / 40) * 100), 100);

    // --- Income: estimated from average ratings + luxury vs budget presence ---
    const avgRating = businesses.length > 0
        ? businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.length
        : 3.5;

    let luxuryCount = 0;
    for (const type of LUXURY_TYPES.slice(0, 2)) {
        const places = await nearbySearch(service, location, 1500, type);
        luxuryCount += places.length;
    }
    let budgetCount = 0;
    for (const type of BUDGET_TYPES.slice(0, 2)) {
        const places = await nearbySearch(service, location, 1500, type);
        budgetCount += places.length;
    }
    const luxuryRatio = luxuryCount + budgetCount > 0
        ? luxuryCount / (luxuryCount + budgetCount)
        : 0.5;
    const income = Math.min(Math.round(((avgRating / 5) * 40) + (luxuryRatio * 60)), 100);

    // --- Age: young vs older demographic indicators ---
    let youngCount = 0;
    for (const type of YOUNG_DEMOGRAPHIC_TYPES.slice(0, 3)) {
        const places = await nearbySearch(service, location, 1500, type);
        youngCount += places.length;
    }
    let olderCount = 0;
    for (const type of OLDER_DEMOGRAPHIC_TYPES.slice(0, 3)) {
        const places = await nearbySearch(service, location, 1500, type);
        olderCount += places.length;
    }
    const youngRatio = youngCount + olderCount > 0
        ? youngCount / (youngCount + olderCount)
        : 0.5;
    // Higher score = younger area (more young-demographic businesses)
    const age = Math.min(Math.round(youngRatio * 100), 100);

    // --- Family Size: schools/parks vs nightlife ---
    let familyCount = 0;
    for (const type of FAMILY_TYPES.slice(0, 3)) {
        const places = await nearbySearch(service, location, 1500, type);
        familyCount += places.length;
    }
    const familyRatio = familyCount + youngCount > 0
        ? familyCount / (familyCount + youngCount)
        : 0.5;
    const familySize = Math.min(Math.round(familyRatio * 100), 100);

    return { accessibility, daytimePop, income, age, familySize };
}

// ============================================================
// 4. Competitors Chart Data (from real businesses)
// ============================================================

function getCompetitorChartData(businesses: Business[]): CompetitorChartEntry[] {
    // Take top competitors by rating, map to chart format
    return businesses
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8)
        .map((b) => ({
            name: b.name.length > 25 ? b.name.substring(0, 22) + '...' : b.name,
            size: Math.round(b.distance * 200) || 50, // approximate "size" from presence
            rating: b.rating || 0,
            distance: b.distance,
        }));
}

// ============================================================
// Main: Gather all location intelligence
// ============================================================

export async function gatherLocationIntelligence(
    location: Location,
    businessType: string,
    businesses: Business[],
): Promise<LocationIntelligenceData> {
    if (!window.google?.maps) {
        console.warn('Google Maps not loaded, returning default data');
        return getDefaultData();
    }

    const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
    );

    console.log('📊 Gathering location intelligence for:', location.address);

    try {
        // Run demographics and location profile in parallel where possible
        const [competitionDensity, demographics, locationProfile] = await Promise.all([
            getCompetitionDensity(service, location, businessType),
            getDemographics(service, location),
            getLocationProfile(service, location, businesses),
        ]);

        const competitors = getCompetitorChartData(businesses);

        console.log('✅ Location intelligence gathered:', {
            competitionDensity,
            demographics,
            locationProfile,
            competitorCount: competitors.length,
        });

        return { competitionDensity, demographics, locationProfile, competitors };
    } catch (error) {
        console.error('Error gathering location intelligence:', error);
        return getDefaultData();
    }
}

// ============================================================
// Default fallback data (used when Google Maps not available)
// ============================================================

function getDefaultData(): LocationIntelligenceData {
    return {
        competitionDensity: [
            { radius: '1km', category: 'Restaurants', density: 0 },
            { radius: '1km', category: 'Cafes', density: 0 },
            { radius: '3km', category: 'Restaurants', density: 0 },
            { radius: '3km', category: 'Cafes', density: 0 },
            { radius: '5km', category: 'Restaurants', density: 0 },
            { radius: '5km', category: 'Cafes', density: 0 },
        ],
        demographics: { office: 50, residents: 50 },
        locationProfile: { age: 50, income: 50, familySize: 50, daytimePop: 50, accessibility: 50 },
        competitors: [],
    };
}
