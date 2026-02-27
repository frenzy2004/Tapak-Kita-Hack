
export interface ScrapeResponse {
    success: boolean;
    data: {
        markdown: string;
        metadata: {
            title?: string;
            description?: string;
            language?: string;
            sourceURL?: string;
        };
    };
}

export interface MapResponse {
    success: boolean;
    links: string[];
}

class FirecrawlService {
    private apiKey: string;
    private baseUrl = 'https://api.firecrawl.dev/v1';

    constructor(apiKey: string = import.meta.env.VITE_FIRECRAWL_API_KEY) {
        this.apiKey = apiKey;
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        if (!this.apiKey) {
            throw new Error('Firecrawl API key is not configured');
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `Firecrawl error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Scrape a single URL to get clean markdown content
     */
    async scrapeUrl(url: string): Promise<ScrapeResponse> {
        return this.makeRequest<ScrapeResponse>('/scrape', {
            method: 'POST',
            body: JSON.stringify({
                url,
                formats: ['markdown'],
            }),
        });
    }

    /**
     * Search for URLs related to a query (e.g., "best cafes in klang")
     */
    async mapSearch(query: string, searchLimit: number = 5): Promise<MapResponse> {
        return this.makeRequest<MapResponse>('/map', {
            method: 'POST',
            body: JSON.stringify({
                url: 'https://www.google.com/search?q=' + encodeURIComponent(query),
                searchLimit,
            }),
        });
    }

    /**
     * Crawl a website to find all subpages (batch process)
     */
    async crawlUrl(url: string, limit: number = 10): Promise<{ id: string }> {
        return this.makeRequest<{ id: string }>('/crawl', {
            method: 'POST',
            body: JSON.stringify({
                url,
                limit,
                scrapeOptions: {
                    formats: ['markdown']
                }
            }),
        });
    }

    /**
     * Check status of a crawl job
     */
    async getCrawlStatus(id: string): Promise<any> {
        return this.makeRequest(`/crawl/${id}`);
    }
}

export const firecrawlService = new FirecrawlService();
export default firecrawlService;
