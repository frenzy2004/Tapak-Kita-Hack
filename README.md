# 🌍 Tapak — Location Intelligence Platform

> **Find your perfect business spot.** Tapak is an AI-powered location intelligence platform that helps entrepreneurs and businesses make data-driven decisions about where to set up shop in Malaysia.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)

---

## ✨ Features

### 🏠 Landing Page
- **Cinematic video background** with interactive 3D globe (powered by [COBE](https://github.com/shuding/cobe))
- Claymorphism design system with glassmorphism form elements
- Google Places autocomplete for location search
- Business type & scale selection

### 📊 Intelligence Dashboard
- **Bento grid layout** with clickable preview cards for each module
- Dark-to-light gradient header with 3D globe backdrop
- Multi-tab analysis system with cached data

### 🗺️ Location Intelligence
- **Google Maps** integration with competitor markers & radius overlays
- Real-time geocoding & nearby business discovery via Places API
- Interactive business cards with ratings and reviews

### 📈 Market Data & Analytics
- **Success Score** — AI-calculated predicted success percentage
- KPI cards (traffic, demand, competition density)
- Seasonal demand trends (line chart)
- Demographic breakdown (donut chart)
- Competitor analysis (scatter plot)
- Competition density by radius (bar chart)

### 🛰️ Urban Analysis
- **Satellite change detection** — before/after imagery comparison
- **NDVI vegetation analysis** — greenery and urban growth metrics
- Powered by unified satellite API service

### 🏘️ Rental Analysis
- Location-based rental price scraping and comparison
- Average rent per sq ft metrics

### 🌤️ Weather Integration
- Real-time weather data from Malaysia's data.gov.my API
- Localized forecast display

### 🤖 AI Assistant
- Floating AI chat assistant with full analysis context
- Context-aware responses based on current location data

### 📄 PDF Export
- Generate detailed analysis reports with charts and maps

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **3D / Visuals** | COBE (WebGL Globe), Three.js, Framer Motion, GSAP |
| **Maps** | Google Maps JavaScript API, Places API, Geocoding API |
| **Charts** | Chart.js + react-chartjs-2 |
| **UI Components** | Radix UI, Lucide Icons, shadcn/ui |
| **PDF** | jsPDF + html2canvas |
| **Backend Services** | Supabase, Express |
| **Build** | Vite 7 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Google Maps API Key (with Maps JS, Places, and Geocoding APIs enabled)

### Installation

```bash
# Clone the repo
git clone https://github.com/frenzy2004/Tapak-Kita-Hack.git
cd Tapak-Kita-Hack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Google Maps API key:
# VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Start development server
npm run dev
```

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable: **Maps JavaScript API**, **Places API**, **Geocoding API**
4. Create an API key and add it to your `.env` file

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── LocationRequest.tsx       # Landing page (video + globe + form)
│   └── LocationAnalysis.tsx      # Intelligence dashboard
├── components/
│   ├── GoogleMap.tsx              # Maps integration
│   ├── FloatingAI.tsx             # AI assistant
│   ├── PreviewCard.tsx            # Bento grid cards
│   ├── SatelliteAnalysis.tsx      # Satellite change detection
│   ├── NDVIAnalysis.tsx           # Vegetation analysis
│   ├── RentLocationContent.tsx    # Rental analysis
│   ├── WeatherCard.tsx            # Weather display
│   ├── KPICards.tsx               # KPI metrics
│   ├── BusinessCard.tsx           # Business listings
│   ├── charts/                    # Chart components
│   └── ui/                        # Reusable UI (globe, button, input)
├── services/
│   ├── unifiedApiService.ts       # Satellite API client
│   ├── weatherService.ts          # Weather API client
│   ├── rentalScraper.ts           # Rental data service
│   ├── locationIntelligence.ts    # Location analysis engine
│   └── satelliteService.ts        # Satellite data service
├── utils/
│   ├── analyticsCalculator.ts     # Success score & KPI calculation
│   ├── geocoding.ts               # Address → coordinates
│   ├── placesService.ts           # Google Places wrapper
│   └── pdfExport.ts               # PDF report generation
├── hooks/
│   └── useGoogleMaps.ts           # Google Maps loader hook
├── data/
│   └── mockData.ts                # Fallback mock data
├── types/
│   └── index.ts                   # TypeScript definitions
├── App.tsx                        # App router
├── main.tsx                       # Entry point
└── index.css                      # Global styles & design tokens
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🌐 Browser Support

Chrome 90+ · Firefox 88+ · Safari 14+ · Edge 90+ · Mobile browsers

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.