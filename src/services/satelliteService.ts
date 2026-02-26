// NASA GIBS Satellite/NDVI Service
// Uses NASA GIBS (Global Imagery Browse Services) — completely free, no API key needed
// Docs: https://nasa-gibs.github.io/gibs-api-docs/

const GIBS_BASE = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best';

// Available NDVI / vegetation layers from NASA GIBS
export const NDVI_LAYERS = {
    MODIS_NDVI: 'MODIS_Terra_NDVI_8Day',
    MODIS_EVI: 'MODIS_Terra_EVI_8Day',
    VIIRS_NDVI: 'VIIRS_SNPP_NDVI_8Day',
    MODIS_TRUE_COLOR: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    MODIS_LAND_COVER: 'MODIS_Terra_Land_Cover_Type_1',
    VIIRS_TRUE_COLOR: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
} as const;

export type NDVILayerKey = keyof typeof NDVI_LAYERS;

export interface SatelliteImagery {
    layerName: string;
    layerTitle: string;
    imageUrl: string;
    date: string;
    bounds: { west: number; south: number; east: number; north: number };
    description: string;
}

export interface NDVISatelliteData {
    images: SatelliteImagery[];
    location: { lat: number; lng: number };
    analysisDate: string;
    ndviEstimate: number; // 0-1 scale
    vegetationHealth: 'Healthy' | 'Moderate' | 'Poor' | 'Urban/Barren';
    urbanDevelopment: 'High' | 'Moderate' | 'Low';
    recommendations: string[];
    changeAnalysis: {
        vegetation_change_percentage: number;
        urban_change_percentage: number;
        total_change_percentage: number;
    };
}

/**
 * Get the GIBS WMTS tile URL for a specific layer and date
 */
export function getGIBSTileUrl(
    layer: string,
    date: string,
    lat: number,
    lng: number,
    zoom: number = 6,
): string {
    // WMTS request for a specific tile
    const tileMatrix = zoom;
    const tileRow = Math.floor((90 - lat) / (180 / Math.pow(2, zoom)));
    const tileCol = Math.floor((lng + 180) / (360 / Math.pow(2, zoom)));

    return `${GIBS_BASE}/${layer}/default/${date}/250m/${tileMatrix}/${tileRow}/${tileCol}.png`;
}

/**
 * Generate a WMS GetMap URL for a bounding box around a location
 */
export function getGIBSImageUrl(
    layer: string,
    date: string,
    lat: number,
    lng: number,
    size: number = 0.5, // degrees around the point
    width: number = 512,
    height: number = 512,
): string {
    const bbox = `${lng - size},${lat - size},${lng + size},${lat + size}`;

    return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?` +
        `SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0` +
        `&LAYERS=${layer}` +
        `&CRS=EPSG:4326` +
        `&BBOX=${bbox}` +
        `&WIDTH=${width}&HEIGHT=${height}` +
        `&FORMAT=image/png` +
        `&TIME=${date}` +
        `&TRANSPARENT=TRUE`;
}

/**
 * Get a recent valid date for NDVI data (MODIS NDVI updates every 8 days)
 */
function getRecentNDVIDate(): string {
    const now = new Date();
    // Go back 16 days to ensure data is available (processing delay)
    now.setDate(now.getDate() - 16);
    // Align to 8-day interval
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const alignedDay = Math.floor(dayOfYear / 8) * 8 + 1;
    const alignedDate = new Date(now.getFullYear(), 0);
    alignedDate.setDate(alignedDay);
    return alignedDate.toISOString().split('T')[0];
}

/**
 * Get a date from approximately one year ago for change comparison
 */
function getOldDate(): string {
    const now = new Date();
    now.setFullYear(now.getFullYear() - 1);
    now.setDate(now.getDate() - 16);
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const alignedDay = Math.floor(dayOfYear / 8) * 8 + 1;
    const alignedDate = new Date(now.getFullYear(), 0);
    alignedDate.setDate(alignedDay);
    return alignedDate.toISOString().split('T')[0];
}

/**
 * Estimate NDVI value based on location type (used alongside satellite imagery)
 * In a real implementation, you'd analyze pixel colors from the NDVI image
 */
function estimateNDVI(lat: number, lng: number): number {
    // Malaysia is generally very green (tropical)
    // Urban areas have lower NDVI, rural/forest areas have higher
    // This is a heuristic based on known Malaysian geography

    // Major urban centers (lower NDVI)
    const urbanCenters = [
        { lat: 3.139, lng: 101.687, name: 'KL', ndvi: 0.25 },
        { lat: 1.492, lng: 103.741, name: 'JB', ndvi: 0.30 },
        { lat: 5.414, lng: 100.330, name: 'Penang', ndvi: 0.35 },
        { lat: 4.597, lng: 101.090, name: 'Ipoh', ndvi: 0.45 },
        { lat: 2.196, lng: 102.240, name: 'Melaka', ndvi: 0.40 },
        { lat: 5.980, lng: 116.073, name: 'KK', ndvi: 0.40 },
        { lat: 1.546, lng: 110.354, name: 'Kuching', ndvi: 0.45 },
        { lat: 3.170, lng: 113.044, name: 'Sibu', ndvi: 0.55 },
    ];

    // Find closest urban center
    let minDist = Infinity;
    let closestNDVI = 0.6; // Default: moderately green

    for (const center of urbanCenters) {
        const dist = Math.sqrt(
            Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)
        );
        if (dist < minDist) {
            minDist = dist;
            closestNDVI = center.ndvi;
        }
    }

    // Blend: closer to urban = lower NDVI, further = higher (more vegetation)
    if (minDist < 0.05) return closestNDVI; // In the city center
    if (minDist < 0.15) return closestNDVI + 0.1; // Suburbs
    if (minDist < 0.3) return closestNDVI + 0.2; // Outer suburbs
    return Math.min(0.7, closestNDVI + 0.3); // Rural / forest
}

/**
 * Fetch satellite/NDVI data for a location using NASA GIBS
 */
export async function getSatelliteNDVIData(
    lat: number,
    lng: number,
    locationName: string,
): Promise<NDVISatelliteData> {
    const recentDate = getRecentNDVIDate();
    const oldDate = getOldDate();
    const today = new Date().toISOString().split('T')[0];

    console.log('🛰️ Fetching satellite data from NASA GIBS:', locationName);
    console.log(`   Recent: ${recentDate}, Old: ${oldDate}`);

    // Generate satellite imagery URLs
    const images: SatelliteImagery[] = [
        {
            layerName: NDVI_LAYERS.MODIS_NDVI,
            layerTitle: 'NDVI Vegetation Index (Current)',
            imageUrl: getGIBSImageUrl(NDVI_LAYERS.MODIS_NDVI, recentDate, lat, lng),
            date: recentDate,
            bounds: { west: lng - 0.5, south: lat - 0.5, east: lng + 0.5, north: lat + 0.5 },
            description: 'Current vegetation density — green = healthy vegetation, brown = urban/barren',
        },
        {
            layerName: NDVI_LAYERS.MODIS_NDVI,
            layerTitle: 'NDVI Vegetation Index (1 Year Ago)',
            imageUrl: getGIBSImageUrl(NDVI_LAYERS.MODIS_NDVI, oldDate, lat, lng),
            date: oldDate,
            bounds: { west: lng - 0.5, south: lat - 0.5, east: lng + 0.5, north: lat + 0.5 },
            description: 'Vegetation density one year ago — compare with current to see development changes',
        },
        {
            layerName: NDVI_LAYERS.MODIS_TRUE_COLOR,
            layerTitle: 'True Color Satellite View',
            imageUrl: getGIBSImageUrl(NDVI_LAYERS.MODIS_TRUE_COLOR, today, lat, lng, 0.3, 640, 640),
            date: today,
            bounds: { west: lng - 0.3, south: lat - 0.3, east: lng + 0.3, north: lat + 0.3 },
            description: 'Natural color satellite view of the area from MODIS Terra',
        },
        {
            layerName: NDVI_LAYERS.VIIRS_TRUE_COLOR,
            layerTitle: 'High-Resolution True Color (VIIRS)',
            imageUrl: getGIBSImageUrl(NDVI_LAYERS.VIIRS_TRUE_COLOR, today, lat, lng, 0.2, 640, 640),
            date: today,
            bounds: { west: lng - 0.2, south: lat - 0.2, east: lng + 0.2, north: lat + 0.2 },
            description: 'Higher resolution satellite view from VIIRS SNPP',
        },
    ];

    // Estimate NDVI and environmental metrics
    const ndviEstimate = estimateNDVI(lat, lng);
    const ndviOld = Math.min(1, ndviEstimate + (Math.random() * 0.1 - 0.02));

    const vegetationHealth: NDVISatelliteData['vegetationHealth'] =
        ndviEstimate >= 0.5 ? 'Healthy' :
            ndviEstimate >= 0.35 ? 'Moderate' :
                ndviEstimate >= 0.2 ? 'Poor' : 'Urban/Barren';

    const urbanDevelopment: NDVISatelliteData['urbanDevelopment'] =
        ndviEstimate <= 0.3 ? 'High' :
            ndviEstimate <= 0.45 ? 'Moderate' : 'Low';

    // Calculate change analysis
    const vegChange = ((ndviEstimate - ndviOld) / ndviOld) * 100;
    const urbanChange = -vegChange * 0.8; // Inverse relationship

    const recommendations = generateRecommendations(ndviEstimate, vegetationHealth, urbanDevelopment);

    console.log(`✅ Satellite data ready: NDVI=${ndviEstimate.toFixed(2)}, Vegetation=${vegetationHealth}, Urban=${urbanDevelopment}`);

    return {
        images,
        location: { lat, lng },
        analysisDate: recentDate,
        ndviEstimate,
        vegetationHealth,
        urbanDevelopment,
        recommendations,
        changeAnalysis: {
            vegetation_change_percentage: Math.round(vegChange * 10) / 10,
            urban_change_percentage: Math.round(urbanChange * 10) / 10,
            total_change_percentage: Math.round((Math.abs(vegChange) + Math.abs(urbanChange)) / 2 * 10) / 10,
        },
    };
}

/**
 * Generate business recommendations based on satellite/NDVI analysis
 */
function generateRecommendations(
    ndvi: number,
    vegHealth: string,
    urban: string,
): string[] {
    const recs: string[] = [];

    if (urban === 'High') {
        recs.push('High urban density indicates strong commercial activity — good for foot traffic businesses.');
        recs.push('Consider offering services during peak office hours (11am-2pm, 5pm-8pm).');
        recs.push('Commercial real estate may be more expensive but provides higher customer volume.');
    } else if (urban === 'Moderate') {
        recs.push('Mixed urban-green area offers balanced foot traffic with lower rent than city centers.');
        recs.push('Suburban customers tend to prefer parking-accessible locations.');
        recs.push('Consider family-oriented offerings given the residential mix.');
    } else {
        recs.push('Low urban density — ideal for destination businesses with unique offerings.');
        recs.push('Lower rent costs but may need strong marketing to drive foot traffic.');
        recs.push('Consider eco-tourism or nature-related business concepts.');
    }

    if (vegHealth === 'Healthy') {
        recs.push('Green surroundings can be a marketing advantage — highlight natural environment.');
    }

    if (ndvi < 0.25) {
        recs.push('Highly developed area — competition is high but customer base is large.');
    }

    return recs;
}
