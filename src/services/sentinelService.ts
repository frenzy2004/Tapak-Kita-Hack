// ============================================================
// Sentinel Hub Direct REST API Service
// Does NOT use sentinelhub-js (which is Node.js only).
// Instead, uses native fetch via the Vite proxy to bypass CORS.
// Proxy config in vite.config.ts routes /sentinel-auth → https://services.sentinel-hub.com
// ============================================================

// Routed through Vite proxy → /sentinel-api → https://services.sentinel-hub.com
// This resolves CORS: direct browser requests to sentinel-hub.com are blocked.
const SH_PROCESSING_URL = '/sentinel-api/api/v1/process';

// Cache the token to avoid re-fetching on every call
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// 1. Get OAuth2 Access Token (via Vite proxy to avoid CORS)
export async function getAuthToken(): Promise<string | null> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    const clientId = import.meta.env.VITE_SENTINEL_HUB_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SENTINEL_HUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('Sentinel Hub credentials not found in environment variables.');
        return null;
    }

    try {
        // /sentinel-auth is a Vite dev proxy → https://services.sentinel-hub.com
        const response = await fetch('/sentinel-auth/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Auth failed (${response.status}): ${text}`);
        }

        const data = await response.json();
        cachedToken = data.access_token;
        // expires_in is in seconds; refresh 60s early
        tokenExpiry = now + (data.expires_in - 60) * 1000;
        return cachedToken;
    } catch (err) {
        console.error('Error requesting Sentinel Hub auth token:', err);
        return null;
    }
}

// 2. Fetch True-Color (RGB) Sentinel-2 L2A Image as a blob URL
export async function fetchSatelliteImage(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number
): Promise<string> {
    const token = await getAuthToken();
    if (!token) throw new Error('Could not authenticate with Sentinel Hub');

    const toTime = new Date();
    const fromTime = new Date();
    fromTime.setMonth(toTime.getMonth() - 3); // 3-month window for better coverage

    const body = {
        input: {
            bounds: {
                bbox: [minLon, minLat, maxLon, maxLat],
                properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
            },
            data: [
                {
                    type: 'sentinel-2-l2a',
                    dataFilter: {
                        timeRange: {
                            from: fromTime.toISOString(),
                            to: toTime.toISOString(),
                        },
                        mosaickingOrder: 'leastCC', // least cloud coverage
                    },
                },
            ],
        },
        output: {
            width: 512,
            height: 512,
            responses: [{ identifier: 'default', format: { type: 'image/jpeg' } }],
        },
        evalscript: `
      //VERSION=3
      function setup() {
        return { input: ["B04","B03","B02"], output: { bands: 3 } };
      }
      function evaluatePixel(sample) {
        return [2.5*sample.B04, 2.5*sample.B03, 2.5*sample.B02];
      }
    `,
    };

    const response = await fetch(SH_PROCESSING_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Sentinel Hub Processing API error (${response.status}): ${text}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// 3. Fetch NDVI-colourised Sentinel-2 L2A Image as a blob URL
export async function fetchNDVIImage(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number
): Promise<string> {
    const token = await getAuthToken();
    if (!token) throw new Error('Could not authenticate with Sentinel Hub');

    const toTime = new Date();
    const fromTime = new Date();
    fromTime.setMonth(toTime.getMonth() - 3);

    const body = {
        input: {
            bounds: {
                bbox: [minLon, minLat, maxLon, maxLat],
                properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
            },
            data: [
                {
                    type: 'sentinel-2-l2a',
                    dataFilter: {
                        timeRange: {
                            from: fromTime.toISOString(),
                            to: toTime.toISOString(),
                        },
                        mosaickingOrder: 'leastCC',
                    },
                },
            ],
        },
        output: {
            width: 512,
            height: 512,
            responses: [{ identifier: 'default', format: { type: 'image/jpeg' } }],
        },
        evalscript: `
      //VERSION=3
      function setup() {
        return { input: ["B08","B04"], output: { bands: 3 } };
      }
      function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.0001);
        if (ndvi < 0)    return [0.5, 0.5, 0.5];
        if (ndvi < 0.1)  return [0.94, 0.9, 0.7];
        if (ndvi < 0.2)  return [0.8, 0.86, 0.4];
        if (ndvi < 0.35) return [0.4, 0.8, 0.15];
        if (ndvi < 0.5)  return [0.1, 0.6, 0.07];
        return [0.0, 0.4, 0.03];
      }
    `,
    };

    const response = await fetch(SH_PROCESSING_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Sentinel Hub NDVI error (${response.status}): ${text}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}
