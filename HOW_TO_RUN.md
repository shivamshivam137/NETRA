# 🚀 NETRA Web Application — Run & Setup Guide

This guide provides step-by-step instructions to install, configure, and run the **NETRA (Networked Engine for Traffic Recognition and Analytics)** frontend web application on your local machine.

---

## 📋 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Quick Start (One-Liner)](#-quick-start)
3. [Step-by-Step Setup](#-step-by-step-setup)
   - [Step 1: Open Terminal / Shell](#step-1-open-terminal--shell)
   - [Step 2: Navigate to Frontend Directory](#step-2-navigate-to-frontend-directory)
   - [Step 3: Install Dependencies](#step-3-install-dependencies)
   - [Step 4: Verify Environment Configuration](#step-4-verify-environment-configuration)
   - [Step 5: Start Development Server](#step-5-start-development-server)
4. [Accessing the Application](#-accessing-the-application)
   - [Quick Demo Access](#quick-demo-access)
   - [Available Modules & Routes](#available-modules--routes)
5. [Useful Scripts & Commands](#-useful-scripts--commands)
6. [Troubleshooting](#-troubleshooting)

---

## 📌 Prerequisites

Before running the application, ensure you have the following installed on your machine:

- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x` LTS or latest)
  - Verify with: `node -v`
- **npm**: `v9.0.0` or higher (comes bundled with Node.js)
  - Verify with: `npm -v`
- **Modern Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave

---

## ⚡ Quick Start

If you already have Node.js and npm installed, simply run:

```bash
cd NETRA_Core
npm install
npm run dev
```

Then open your browser at **[http://localhost:5173/](http://localhost:5173/)**.

---

## 🛠️ Step-by-Step Setup

### Step 1: Open Terminal / Shell
Open your preferred terminal (PowerShell, Command Prompt, Git Bash, or VS Code integrated terminal).

### Step 2: Navigate to Frontend Directory
Change your working directory to the `NETRA_Core` folder:

```bash
cd NETRA_Core
```

*(If you are already inside the root `NETRA` folder, the relative path is `NETRA_Core`)*

---

### Step 3: Install Dependencies
Install all required npm packages:

```bash
npm install
```

> **Note:** This installs dependencies such as React 19, Vite, Tailwind CSS v4, Lucide React, Leaflet & React-Leaflet, Recharts, and Supabase client.

---

### Step 4: Verify Environment Configuration
Check that `.env` exists in the `NETRA_Core/` directory.

The application includes configured Supabase credentials:
```env
VITE_SUPABASE_URL=https://uzrnqvzryuswkccmekqn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If `.env` is missing, you can create it or copy from `.env.example`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

---

### Step 5: Start Development Server
Run the Vite development server:

```bash
npm run dev
```

You should see output similar to:
```text
  VITE v8.2.2  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🖥️ Accessing the Application

### Quick Demo Access
1. Open your browser and navigate to: **`http://localhost:5173/`**
2. On the login screen, click the **⚡ Quick Demo Login** button.
3. You will immediately be authenticated and redirected to the **Command Center Dashboard**.

---

### Available Modules & Routes

| Route | Name | Description |
| :--- | :--- | :--- |
| `/login` | **Authentication** | Secure operator sign-in & demo bypass |
| `/dashboard` | **Command Center** | Real-time traffic metrics, active cameras, live alerts & GIS summary |
| `/map` | **Surveillance Map** | Full-screen interactive Leaflet map with online/warning/offline camera nodes |
| `/vehicles` | **Vehicle Trajectory** | ANPR search, vehicle matching, multi-camera route reconstruction |
| `/alerts` | **Alerts & Incidents** | Real-time safety violations, red-light runs, speeding & ANPR matches |
| `/analytics` | **Traffic Analytics** | Flow rates, peak hours, congestion indices & analytics charts |
| `/prevention` | **AI Prevention Hub** | Autonomous AI simulation, route rerouting & congestion prevention |

---

## ⌨️ Useful Scripts & Commands

All commands should be executed from within the `NETRA_Core/` directory:

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with hot-reload |
| `npm run dev -- --host` | Exposes dev server to your local network (e.g. access from mobile devices) |
| `npm run build` | Compiles and optimizes assets into production bundle in `dist/` |
| `npm run preview` | Locally serves the production build created by `npm run build` |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues |

---

## ❓ Troubleshooting

### 1. Port 5173 Already in Use
If port 5173 is occupied by another process, Vite will automatically switch to `5174` or prompt you. You can also specify an explicit port:
```bash
npx vite --port 3000
```

### 2. Node.js Version Incompatibility
If you encounter errors during `npm install`, check your Node version:
```bash
node -v
```
Ensure you are using **Node.js 18 or above**. You can update Node.js via [nodejs.org](https://nodejs.org/) or using `nvm` (Node Version Manager).

### 3. Clear Cache and Reinstall
If packages fail to resolve:
```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```
```bash
# macOS / Linux
rm -rf node_modules package-lock.json
npm install
```

### 4. Supabase Network Issues
If the Supabase database connection is blocked by a firewall, NETRA's demo mode includes mock data and fallback handlers so the UI and map features continue to function seamlessly.

---

**Developed for the NETRA Surveillance & Traffic Management Platform**
