# Tapak - intelligent Location Analytics

[![Team](https://img.shields.io/badge/Team-Infinity-blueviolet)](https://github.com/your-repo-link)
[![SDG](https://img.shields.io/badge/SDG-8%2C%209%2C%2011-blue)](https://sdgs.un.org/goals)

## 1. Repository Overview + Team Introduction

**Tapak** (Malay for "Place" or "Foundation") is a next-generation location intelligence platform designed to empower Malaysian entrepreneurs with data-driven site selection. By bridging the gap between complex geospatial data and business decision-making, Tapak makes sophisticated market analysis accessible to everyone.

### 🌟 Team Infinity
| Member | Role |
| :--- | :--- |
| **Muthuraman Palaniappan** | Backend Developer & Team Lead|
| **Lee Ping Xian** | UI/UX Designer |
| **Muhammad Ahmad** | Pitcher & Presentation Specialist |
| **Leong Wui Yip** | Testing & Documentation |

---

## 2. Project Overview

### Problem Statement
Small business owners in Malaysia often rely on "gut feeling" or limited surface-level observations when choosing a business location. They struggle to find optimal sites due to a lack of accessible, consolidated geospatial and market intelligence data, leading to high failure rates for new ventures.

### SDG Alignment
Our solution directly contributes to the United Nations Sustainable Development Goals:
- **SDG 8: Decent Work and Economic Growth** – By increasing the success rate of small businesses.
- **SDG 9: Industry, Innovation, and Infrastructure** – Using AI and satellite data to modernize market research.
- **SDG 11: Sustainable Cities and Communities** – Promoting better urban planning and optimized resource distribution.

### The Solution
Tapak provides a comprehensive dashboard that visualizes competitor density, environmental health (NDVI), and market sentiment. It transforms raw data from Google Maps, Earth Engine, and the open web into actionable scores and recommendations.

---

## 3. Key Features

### 🚀 Suggest Mode (AI Recommendation)
The AI automatically crawls and analyzes vast areas to recommend the top 3 best sites for a specific business type (e.g., "Cafe" in "Klang"). It considers foot traffic predictors, competitor gaps, and environmental factors.

### 🛠️ Manual Mode (Score & Audit)
Users can select a specific "preset business" and point to a custom location on the map. Tapak generates a **Success Score** by auditing that specific spot, outputting a detailed list of Pros and Cons.

### 🔍 Tapak AI Assistant (with Web Search)
An integrated chatbot powered by Google Gemini that can "search the web" in real-time using Firecrawl. It can answer hyper-local questions like *"What is the current cafe trend in this specific street?"*

---

## 4. Overview of Technologies Used

### Google Technologies
- **Google Maps Platform**: Core mapping engine, Places API for competitor data, and Autocomplete for location selection
- **Google Gemini (2.5 Flash)**: The "brain" of the AI Assistant, synthesizing disparate data points into human-readable insights.

### Other Supporting Tools
- **Firecrawl**: Advanced web scraping engine used to provide the AI Assistant with real-time local market intelligence
- **React 18 & TypeScript**: Robust frontend architecture for a smooth SPA experience.
- **Tailwind CSS**: Modern styling for our unique "Claymorphic" design system.
- **Chart.js**: Dynamic data visualization for demographics and competitor trends.
- **OpenWeatherMap API**: Local climate data integration.
- **Lucide React**: Premium icon set for consistent UI.

---

## 5. Implementation Details & Innovation

### System Architecture
Tapak uses a **Multi-Stage Inference** architecture. When a location is analyzed:
1. **Environmental layer** is pulled from GEE (Satellite).
2. **Economic layer** is pulled from Google Places (Competitors).
3. **Intelligence layer** is scraped via Firecrawl (Real-time news/trends).
4. **Synthesis layer** (Gemini) combines these into the final Success Score.

### Innovation
Unlike traditional GIS tools which are too technical, or basic map markers which lack depth, Tapak's innovation lies in its **Accessibility**. We use a "Claymorphic" UI—soft, tactile, and professional—making high-end satellite and AI analysis feel as simple as using a chat app.

---

## 6. Challenges Faced

1.  **Quota & Rate Limits**: Navigating the free tier limits of high-performance LLMs while maintaining a responsive user experience.
2.  **API Versioning**: Adapting to the latest `v1beta` vs `v1` endpoint differences in the Gemini API to ensure model stability.
3.  **Data Harmonization**: Correlating satellite-derived NDVI data with urban competitor density to create a unified "Success Score" that actually makes sense for business owners.

---

## 7. Installation & Setup

### Prerequisites
- Node.js (v18+)
- NPM or Yarn

### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/tapak-kita-hack.git
   cd tapak-kita-hack
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Setup:**
   Create a `.env` file in the root and add your keys:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_key
   VITE_GEMINI_API_KEY=your_key
   VITE_FIRECRAWL_API_KEY=your_key
   VITE_GEE_PROJECT_ID=your_id
   ```
4. **Run development server:**
   ```bash
   npm run dev
   ```

---

## 8. Future Roadmap

- [ ] **ROI Calculator**: Estimate potential monthly revenue based on high-traffic predictors.
- [ ] **Multi-Site Comparison**: A Side-by-side "Versus" mode for two competing locations.
- [ ] **Mobile Hub**: A lightweight field-app for business owners to perform "on-the-ground" audits.
- [ ] **Real-time Foot Traffic**: Integration with cellular or IoT data for live crowd tracking.

---
© 2026 Team Infinity - Built for KitaHack