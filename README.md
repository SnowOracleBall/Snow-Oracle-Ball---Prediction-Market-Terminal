# Snow Oracle Ball

<div align="center">

![Snow Oracle Ball](https://img.shields.io/badge/Snow%20Oracle%20Ball-Prediction%20Market%20Terminal-0ea5e9?style=for-the-badge&logo=snowflake&logoColor=white)

**A non-custodial prediction market terminal aggregating real-time markets from Polymarket and Kalshi**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)

[Dapps](https://app.snow-oracleball.com/) | [Features](#features) | [Installation](#installation) | [Tech Stack](#tech-stack)

</div>

---

## Overview

Snow Oracle Ball is a "Terminal for Probabilities" - a professional prediction market aggregator with a stunning winter wonderland theme. Users can explore prediction markets, compare probabilities across platforms, track positions, and get AI-powered insights.

### Important Positioning

- This is **NOT** a gambling site
- This is **NOT** a market issuer
- This app does **NOT** custody funds
- This app **ONLY** displays and orchestrates interactions with existing prediction markets

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Explore Markets** | Browse prediction markets with category filtering and sorting |
| **Spread Radar** | Detect arbitrage opportunities across Polymarket and Kalshi |
| **Smart Alerts** | Create price, volume, and resolution alerts for markets |
| **AI Insights** | GPT-4o-mini powered market analysis and portfolio insights |
| **Analytics Dashboard** | Portfolio P&L tracking with interactive charts |
| **Leaderboard** | Top predictors ranked by accuracy and prediction score |
| **Watchlist** | Track your favorite markets in one place |
| **Positions** | View and manage your simulated portfolio positions |
| **Market Detail** | Deep dive into individual markets with price charts |

### Real-Time Data

- **Polymarket RTDS WebSocket** (`wss://ws-live-data.polymarket.com`) for live trade updates
- **60-second caching** to optimize API calls
- **Automatic fallback** to mock data if APIs are unavailable

### Design

- Winter wonderland theme with glassmorphism UI
- Blue color palette (hue 210)
- Scenic winter background with snowflakes
- Light mode default with clean black text
- Inter font for body, JetBrains Mono for numbers

---

## Screenshots

<div align="center">
<table>
<tr>
<td><strong>Explore Markets</strong></td>
<td><strong>AI Insights</strong></td>
</tr>
<tr>
<td>Browse and filter prediction markets</td>
<td>AI-powered market analysis</td>
</tr>
<tr>
<td><strong>Spread Radar</strong></td>
<td><strong>Analytics</strong></td>
</tr>
<tr>
<td>Detect arbitrage opportunities</td>
<td>Portfolio performance tracking</td>
</tr>
</table>
</div>

---

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS
- **Shadcn/ui** - UI components
- **TanStack Query** - Data fetching & caching
- **Wouter** - Lightweight routing
- **Framer Motion** - Animations
- **Recharts** - Charts and graphs
- **Lucide React** - Icons

### Backend
- **Express.js** - Web framework
- **WebSocket** - Real-time data (Polymarket RTDS)
- **OpenAI GPT-4o-mini** - AI insights
- **Drizzle ORM** - Database toolkit

### APIs
- **Polymarket API** - `https://gamma-api.polymarket.com/markets`
- **Kalshi API** - `https://api.elections.kalshi.com/trade-api/v2/markets`
- **Polymarket RTDS** - `wss://ws-live-data.polymarket.com`

---

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/snow-oracle-ball.git
   cd snow-oracle-ball
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Required variables:
   ```env
   SESSION_SECRET=your-session-secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5000
   ```

---

## Project Structure

```
snow-oracle-ball/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Shadcn UI components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── top-bar.tsx
│   │   │   ├── market-card.tsx
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── explore.tsx
│   │   │   ├── ai-insights.tsx
│   │   │   ├── analytics.tsx
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities
│   │   ├── App.tsx            # Root component
│   │   └── index.css          # Global styles
├── server/                    # Backend Express application
│   ├── api-clients.ts         # Polymarket & Kalshi API clients
│   ├── polymarket-ws.ts       # RTDS WebSocket connection
│   ├── ai-insights.ts         # OpenAI integration
│   ├── routes.ts              # API endpoints
│   ├── storage.ts             # In-memory data storage
│   └── index.ts               # Server entry point
├── shared/                    # Shared types and schemas
│   └── schema.ts              # Drizzle schemas & types
├── design_guidelines.md       # UI/UX design system
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/markets` | Get all markets (real-time from APIs) |
| GET | `/api/markets/:id` | Get single market details |
| GET | `/api/watchlist` | Get user's watchlist |
| POST | `/api/watchlist` | Add market to watchlist |
| DELETE | `/api/watchlist/:marketId` | Remove from watchlist |
| GET | `/api/positions` | Get all positions |
| POST | `/api/positions` | Create a new position |
| GET | `/api/predictions` | Get all user predictions |
| POST | `/api/predictions` | Create a prediction |
| POST | `/api/ai/market-analysis` | Get AI analysis for a market |
| POST | `/api/ai/portfolio-insights` | Get AI portfolio insights |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Polymarket](https://polymarket.com/) for market data API
- [Kalshi](https://kalshi.com/) for market data API
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [OpenAI](https://openai.com/) for GPT-4o-mini API

---

<div align="center">

**Built with love and snowflakes**

Made by [Snow Oracle Ball](https://github.com/SnowOracleBall)

</div>
