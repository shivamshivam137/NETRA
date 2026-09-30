# 🚦 NETRA — Networked Engine for Traffic Recognition and Analytics

<div align="center">

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-Active_Prototype-brightgreen?style=for-the-badge)](#)

<br />

**City-Wide AI Surveillance Engine for Multi-Camera ANPR, Vehicle Trajectory Tracking & Autonomous Traffic Analytics**

[Explore Features](#-core-features) • [Quick Start](#-quick-start) • [Architecture](#-system-architecture) • [Run Guide](HOW_TO_RUN.md)

</div>

---

## 📌 Executive Overview

Modern urban centers deploy dense networks of CCTV and Automatic Number Plate Recognition (ANPR) cameras. However, existing surveillance infrastructure operates individual camera feeds in silos—detecting vehicles locally without correlating observations across distributed junctions.

This creates a critical operational blind spot: **law enforcement and traffic authorities cannot reconstruct a vehicle's end-to-end journey or anticipate macro-level congestion bottlenecks in real time.**

**NETRA** bridges this gap. It aggregates distributed ANPR observations, applies spatial-temporal matching, reconstructs multi-camera trajectory paths, and runs autonomous AI traffic prevention to transform isolated camera feeds into unified, city-wide intelligence.

---

## 🏗️ System Architecture

```
   ┌─────────────────────────────────────────────────────────────┐
   │             DISTRIBUTED EDGE CAMERAS / ANPR NODES           │
   │      [ Camera 01 ]       [ Camera 02 ]      [ Camera 03 ]   │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ RTMP / RTSP / Edge OCR Feed
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │             NETRA CENTRAL PROCESSING PIPELINE               │
   │  • License Plate Normalization   • Multi-Camera Associator  │
   │  • Temporal-Spatial Graphing     • Violation Classifier     │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ Realtime Sync
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                SUPABASE PERSISTENCE & TELEMETRY             │
   │  • Camera Nodes & Health Status  • Vehicle Sighting History │
   │  • Incident Violations & Alerts  • Congestion Matrix        │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ WebSockets / REST
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                NETRA WEB COMMAND CENTER (SPA)               │
   │  🗺️ Live GIS Map           🚗 Multi-Camera Trajectory      │
   │  🚨 Real-Time Alert Feeds   📊 Traffic Analytics & Heatmaps │
   │  🤖 AI Signal Optimizer    🌐 Multi-Language (EN / HI)     │
   └─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Core Features

### 1. 🚗 Multi-Camera Vehicle Trajectory Tracking
- **Search by Plate**: Instant lookup for any license plate (e.g., `DL 01 AB 1234`).
- **Path Reconstruction**: Reconnects isolated camera sightings chronologically to display the exact route taken across city junctions.
- **Node Telemetry**: Shows camera IDs, timestamps, speed estimates, and plate crop images at every checkpoint.

### 2. 🗺️ Real-Time GIS Surveillance Map
- **Interactive Geospatial Visualization**: Powered by Leaflet with custom dark-mode cartography.
- **Node Status Indicators**: Color-coded camera operational status:
  - 🟢 **Online**: Live streaming and actively processing feeds.
  - 🟡 **Warning / Congested**: Traffic bottleneck detected at intersection.
  - 🔴 **Offline / Degraded**: Stream dropped or low OCR confidence.
- **Camera Quick-Inspect**: Click any camera pin to view live throughput, speed averages, and recent vehicle logs.

### 3. 🤖 AI Traffic Incident Prevention & Rerouting
- **Bottleneck Simulation**: Predicts junction gridlocks before they escalate.
- **Signal Timing Optimizer**: Dynamically computes recommended green-light extensions and emergency vehicle corridors.
- **Autonomous Rerouting**: Generates alternate paths to divert traffic from saturated arterial roads.

### 4. 🚨 Real-Time Security & Violation Alerting
- **Automated Detection**: Flags traffic infractions including speeding, red-light violations, and wrong-way travel.
- **Hotlist / Stolen Plate Watch**: Instantly raises critical priority alerts when a blacklisted plate is spotted.
- **Operator Action Center**: Acknowledge, resolve, or dispatch patrol units directly from the alert feed.

### 5. 📊 Deep Analytics & Traffic Insights
- **Flow Trends**: Hourly throughput trends with Recharts visualizations.
- **Vehicle Class Distribution**: Automated classification across Sedans, SUVs, Trucks, Buses, and Two-Wheelers.
- **Congestion Heatmap**: Identifies recurrent weekly bottleneck corridors.

---

## 💻 Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) | High-performance reactive UI with instant Hot Module Replacement |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) | Sleek, dark-mode glassmorphic command center aesthetic |
| **Geospatial Mapping** | [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) | Interactive vector mapping and camera node overlays |
| **Data Visualization** | [Recharts](https://recharts.org/) | Responsive traffic volume, velocity, and congestion charts |
| **Icons & UI Assets** | [Lucide React](https://lucide.dev/) | Modern, clean vector iconography |
| **Backend & Realtime** | [Supabase](https://supabase.com/) (PostgreSQL) | Real-time database, authentication, and telemetry storage |
| **Routing** | [React Router v7](https://reactrouter.com/) | Client-side routing with clean navigation |

---

## 📂 Repository Structure

```text
NETRA/
├── HOW_TO_RUN.md               # Detailed installation & run instructions
├── README.md                   # Project documentation & overview
└── netra-frontend/             # React + Vite web application
    ├── public/                 # Static assets & map icons
    ├── src/
    │   ├── assets/             # Branding imagery & logos
    │   ├── components/
    │   │   ├── alerts/         # Alert feed, summary cards & filter controls
    │   │   ├── analytics/      # Speed charts, flow graphs & congestion zones
    │   │   ├── auth/           # Login & registration forms
    │   │   ├── dashboard/      # Command center KPIs & metric widgets
    │   │   ├── layout/         # Navigation sidebar, top header & theme toggle
    │   │   ├── map/            # Leaflet GIS surveillance map view
    │   │   ├── prevention/     # AI traffic simulation, rerouting & signal tuning
    │   │   └── vehicles/       # Trajectory reconstruction & ANPR search cards
    │   ├── context/            # Language (EN/HI) and UI state contexts
    │   ├── data/               # Mock telemetry & city camera network fixtures
    │   ├── hooks/              # Real-time WebSocket & data streaming hooks
    │   ├── pages/              # Primary route views (Dashboard, Map, Vehicles, etc.)
    │   └── services/           # Supabase client, routing engines & API layers
    ├── .env.example            # Environment configuration template
    ├── package.json            # Dependencies & build scripts
    └── vite.config.js          # Vite build & plugin settings
```

---

## ⚡ Quick Start

### 1. Clone & Navigate
```bash
git clone https://github.com/shivamshivam137/NETRA.git
cd NETRA/netra-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

### 4. 🔑 One-Click Demo Access
On the login screen, click **⚡ Quick Demo Login** to immediately enter the Command Center with pre-loaded city surveillance telemetry.

> For a complete setup walkthrough and troubleshooting guide, refer to **[HOW_TO_RUN.md](HOW_TO_RUN.md)**.

---

## ⚙️ Environment Variables

Create a `.env` file inside `netra-frontend/` (or copy from `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🗺️ Roadmap & Future Scope

- [x] Multi-camera trajectory visualization on interactive GIS map
- [x] Real-time incident detection & severity categorization
- [x] AI Signal timing & dynamic alternate routing engine
- [x] Multi-language localization (English / Hindi)
- [ ] Direct RTSP / WebRTC camera stream integration
- [ ] Automated license plate blurred image super-resolution
- [ ] Integration with municipal traffic light controllers (SCATS / ITMS)

---

## 👥 Contributors & Acknowledgements

Developed for the **NETRA Smart City Surveillance & Urban Analytics Initiative**.

Contributions, feature suggestions, and pull requests are welcome! Feel free to open an issue on the [GitHub Repository](https://github.com/shivamshivam137/NETRA).

---

<div align="center">
  <sub>Built with ❤️ for safer, smarter urban mobility.</sub>
</div>
