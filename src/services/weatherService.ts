// Malaysia Weather API Service
// Uses data.gov.my free weather API - no API key needed
// Docs: https://developer.data.gov.my/realtime-api/weather

const WEATHER_API_BASE = 'https://api.data.gov.my/weather/forecast';

export interface WeatherForecast {
    location: {
        location_id: string;
        location_name: string;
    };
    date: string;
    morning_forecast: string;
    afternoon_forecast: string;
    night_forecast: string;
    summary_forecast: string;
    summary_when: string;
    min_temp: number;
    max_temp: number;
}

export interface WeatherData {
    forecasts: WeatherForecast[];
    locationName: string;
    currentTemp: { min: number; max: number };
    rainyDays: number;
    totalDays: number;
    weatherImpact: 'positive' | 'neutral' | 'negative';
    weatherImpactScore: number; // 0-100, higher = better for business
    summary: string;
}

// Forecast text translations (Bahasa Melayu → English)
const FORECAST_TRANSLATIONS: Record<string, string> = {
    'Berjerebu': 'Hazy',
    'Tiada hujan': 'No rain',
    'Hujan': 'Rain',
    'Hujan di beberapa tempat': 'Rain in several areas',
    'Hujan di satu dua tempat': 'Rain in one or two areas',
    'Hujan di satu dua tempat di kawasan pantai': 'Rain in coastal areas',
    'Hujan di satu dua tempat di kawasan pedalaman': 'Rain in inland areas',
    'Ribut petir': 'Thunderstorm',
    'Ribut petir di beberapa tempat': 'Thunderstorms in several areas',
    'Ribut petir di beberapa tempat di kawasan pedalaman': 'Thunderstorms in inland areas',
    'Ribut petir di satu dua tempat': 'Thunderstorms in one or two areas',
    'Ribut petir di satu dua tempat di kawasan pantai': 'Thunderstorms in coastal areas',
    'Ribut petir di satu dua tempat di kawasan pedalaman': 'Thunderstorms in inland areas',
};

// Weather time translations
const WHEN_TRANSLATIONS: Record<string, string> = {
    'Pagi': 'Morning',
    'Malam': 'Night',
    'Petang': 'Afternoon',
    'Pagi dan Petang': 'Morning & Afternoon',
    'Pagi dan Malam': 'Morning & Night',
    'Petang dan Malam': 'Afternoon & Night',
    'Sepanjang Hari': 'All Day',
};

/**
 * Translate Malay forecast text to English
 */
export function translateForecast(malay: string): string {
    return FORECAST_TRANSLATIONS[malay] || malay;
}

export function translateWhen(malay: string): string {
    return WHEN_TRANSLATIONS[malay] || malay;
}

/**
 * Get weather emoji based on forecast text
 */
export function getWeatherEmoji(forecast: string): string {
    if (forecast.includes('Ribut petir')) return '⛈️';
    if (forecast.includes('Hujan di beberapa')) return '🌧️';
    if (forecast.includes('Hujan')) return '🌦️';
    if (forecast.includes('Berjerebu')) return '🌫️';
    if (forecast.includes('Tiada hujan')) return '☀️';
    return '🌤️';
}

/**
 * Check if forecast indicates rain
 */
function isRainy(forecast: string): boolean {
    return forecast.includes('Hujan') || forecast.includes('Ribut');
}

/**
 * Extract a searchable location name from an address
 * e.g., "Near LRT KLCC, Kuala Lumpur, Malaysia" → "Kuala Lumpur"
 */
function extractLocationName(address: string): string {
    // Common Malaysian city/district names to search for
    const knownLocations = [
        'Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya',
        'Cyberjaya', 'Putrajaya', 'Johor Bahru', 'George Town', 'Penang',
        'Ipoh', 'Melaka', 'Kota Kinabalu', 'Kuching', 'Seremban',
        'Klang', 'Kajang', 'Ampang', 'Cheras', 'Kepong', 'Damansara',
        'Bangsar', 'Mont Kiara', 'KLCC', 'Bukit Bintang',
        'Langkawi', 'Cameron Highlands', 'Genting Highlands',
        'Kuantan', 'Kota Bharu', 'Kuala Terengganu', 'Alor Setar',
    ];

    for (const loc of knownLocations) {
        if (address.toLowerCase().includes(loc.toLowerCase())) {
            // Map sub-areas to their parent district for the weather API
            if (['KLCC', 'Bukit Bintang', 'Bangsar', 'Mont Kiara', 'Cheras', 'Kepong', 'Ampang'].includes(loc)) {
                return 'Kuala Lumpur';
            }
            if (['Damansara', 'Subang Jaya'].includes(loc)) {
                return 'Petaling Jaya';
            }
            return loc;
        }
    }

    // Fallback: try to extract city from comma-separated address
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
        // Usually the second-to-last part is the city
        return parts[parts.length - 2] || parts[0];
    }

    return parts[0] || 'Kuala Lumpur';
}

/**
 * Fetch 7-day weather forecast for a location
 */
export async function getWeatherForecast(locationAddress: string): Promise<WeatherData | null> {
    try {
        const locationName = extractLocationName(locationAddress);

        console.log('🌤️ Fetching weather for:', locationName);

        const url = `${WEATHER_API_BASE}?contains=${encodeURIComponent(locationName)}@location__location_name&limit=7`;

        const response = await fetch(url);

        if (!response.ok) {
            console.warn('Weather API returned:', response.status);
            return null;
        }

        const data = await response.json();
        const forecasts: WeatherForecast[] = data.data || data || [];

        if (!Array.isArray(forecasts) || forecasts.length === 0) {
            console.warn('No weather data returned for:', locationName);
            return null;
        }

        // Calculate weather metrics
        const rainyDays = forecasts.filter(f =>
            isRainy(f.summary_forecast)
        ).length;

        const totalDays = forecasts.length;
        const currentTemp = {
            min: forecasts[0]?.min_temp || 24,
            max: forecasts[0]?.max_temp || 34,
        };

        // Calculate weather impact score (0-100)
        // Higher score = better weather for foot traffic & business
        const rainyRatio = rainyDays / totalDays;
        let weatherImpactScore = Math.round((1 - rainyRatio * 0.7) * 100);

        // Extreme heat or cold reduces score
        const avgMax = forecasts.reduce((sum, f) => sum + f.max_temp, 0) / totalDays;
        if (avgMax > 36) weatherImpactScore -= 10;
        if (avgMax < 25) weatherImpactScore -= 5;

        weatherImpactScore = Math.max(0, Math.min(100, weatherImpactScore));

        const weatherImpact: 'positive' | 'neutral' | 'negative' =
            weatherImpactScore >= 70 ? 'positive' :
                weatherImpactScore >= 40 ? 'neutral' : 'negative';

        // Generate summary
        const summary = rainyDays === 0
            ? `Clear weather expected for the next ${totalDays} days — great for foot traffic!`
            : rainyDays <= 2
                ? `Mostly clear with ${rainyDays} rainy day${rainyDays > 1 ? 's' : ''} — good conditions for business.`
                : rainyDays <= 4
                    ? `Mixed weather with ${rainyDays} out of ${totalDays} days expecting rain — moderate impact on foot traffic.`
                    : `Rainy season: ${rainyDays} out of ${totalDays} days with rain — consider indoor-focused strategies.`;

        console.log(`✅ Weather data: ${rainyDays}/${totalDays} rainy days, impact score: ${weatherImpactScore}`);

        return {
            forecasts,
            locationName: forecasts[0]?.location?.location_name || locationName,
            currentTemp,
            rainyDays,
            totalDays,
            weatherImpact,
            weatherImpactScore,
            summary,
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}
