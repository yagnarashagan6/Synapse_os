# Synapse OS Codebase Guide

This document provides a one-line description of every file in the Synapse OS codebase and explains the overall system workflow.

## File Descriptions

### Root Directory
- `.env`: Environment variables for the frontend and shared configurations.
- `.gitignore`: Specifies files and directories to be ignored by Git.
- `.vercelignore`: Specifies files and directories to be ignored by Vercel during deployment.
- `README.md`: Project overview and setup instructions.
- `eslint.config.js`: Configuration for ESLint to maintain code quality.
- `index.html`: The main HTML entry point for the Vite-powered React application.
- `package.json`: Frontend project manifest with dependencies and scripts.
- `postcss.config.js`: Configuration for PostCSS, primarily for Tailwind CSS.
- `tailwind.config.js`: Configuration for Tailwind CSS styling.
- `vercel.json`: Configuration for Vercel deployment and routing.
- `vite.config.js`: Configuration for the Vite build tool.

### `api` Directory (Vercel Serverless Functions)
- `api/competitors.js`: Serverless handler for fetching and scraping competitor data.
- `api/competitors/[id].js`: Serverless handler for operations on a specific competitor (e.g., delete).
- `api/proxy-image.js`: Serverless handler to proxy images (e.g., from Instagram) to avoid CORS issues.
- `api/hygen/generate.js`: Serverless handler to trigger video generation via the HeyGen API.
- `api/hygen/status.js`: Serverless handler to check the status of a HeyGen video generation request.

### `server` Directory (Local Express Server)
- `server/.env`: Environment variables for the backend server (Supabase, Apify, HeyGen keys).
- `server/index.js`: Main entry point for the local Express server, handling API routes and middleware.
- `server/migrate.js`: Script to migrate data (e.g., from MongoDB to Supabase).
- `server/package.json`: Backend project manifest with dependencies and scripts.
- `server/schema.sql`: SQL schema definition for the Supabase database.
- `server/test_actor.js`: Script to test Apify actors.
- `server/test_apify.js`: Script to test general Apify functionality.
- `server/test_deep_scrape.js`: Script to test deep scraping logic for Instagram.
- `server/test_instagram.js`: Script to test Instagram scraping.
- `server/test_regex.js`: Script to test regular expressions used in the project.
- `server/test_supabase.js`: Script to test Supabase connection and operations.
- `server/test_token.js`: Script to test API token validation.
- `server/models/Competitor.js`: (Legacy/Modified) Data model definition for Competitors.

### `src` Directory (React Frontend)
- `src/App.css`: Global styles for the React application.
- `src/App.jsx`: Main application component defining routes and layout.
- `src/index.css`: Tailwind CSS imports and base styles.
- `src/main.jsx`: Entry point that renders the React application into the DOM.

#### `src/pages` (Route Components)
- `src/pages/AITools.jsx`: Dashboard for various AI-powered tools.
- `src/pages/Approvals.jsx`: Interface for reviewing and approving content.
- `src/pages/Calendar.jsx`: Content calendar view for scheduling posts.
- `src/pages/Competitors.jsx`: Management and analysis of competitor data.
- `src/pages/Content.jsx`: Central hub for content creation and management.
- `src/pages/Dashboard.jsx`: Main administrative overview with key metrics.
- `src/pages/PosterGenerator.jsx`: Tool for generating marketing posters.
- `src/pages/Profile.jsx`: User profile settings and information.
- `src/pages/Settings.jsx`: General application settings.
- `src/pages/Sources.jsx`: Management of data sources and feeds.
- `src/pages/Trends.jsx`: Analysis of market and social trends.

#### `src/components` (Reusable UI Components)
- `src/components/poster/GenerateButton.jsx`: Trigger button for poster generation.
- `src/components/poster/PlatformSelector.jsx`: Dropdown/toggle for selecting social media platforms.
- `src/components/poster/PosterForm.jsx`: Form for inputting poster details.
- `src/components/poster/PosterPreview.jsx`: Real-time preview of the generated poster.
- `src/components/poster/SizeSelector.jsx`: Options for selecting poster dimensions.
- `src/components/poster/ToneSelector.jsx`: Options for selecting the visual/textual tone.
- `src/components/ui/Badge.jsx`: Compact label for status or categories.
- `src/components/ui/Button.jsx`: Generic styled button component.
- `src/components/ui/Card.jsx`: Container for grouping related information.
- `src/components/ui/DatePicker.jsx`: Component for selecting dates.
- `src/components/ui/Input.jsx`: Styled text input field.
- `src/components/ui/Select.jsx`: Styled dropdown selection component.
- `src/components/ui/Table.jsx`: Component for displaying structured data.
- `src/components/ui/Tabs.jsx`: Navigation component for switching between views.

---

## Code Workflow

Synapse OS is a full-stack application designed for marketing automation and competitor analysis. The workflow follows a modern decoupled architecture:

### 1. Frontend Interaction (React)
- The user interacts with the UI built with **React** and **Tailwind CSS**.
- Routes defined in `App.jsx` determine which page component (e.g., `Competitors.jsx`, `PosterGenerator.jsx`) is rendered.
- UI components in `src/components` provide a consistent look and feel.

### 2. API Communication
- The frontend makes HTTP requests to API endpoints. 
- In development, it connects to a local **Express server** (`server/index.js`).
- In production (Vercel), it communicates with **Serverless Functions** located in the `api` directory.
- A central configuration (often found in `.env` or matched by the environment) ensures the frontend knows whether to talk to `localhost:5000` or the Vercel production domain.

### 3. Backend Processing & Integrations
- **Data Scraping**: When a user adds a competitor, the backend uses the **Apify Client** to trigger actors (like `instagram-scraper`) that gather social media data.
- **Video Generation**: The `PosterGenerator` and related tools call the **HeyGen API** via the backend proxy to create AI-generated video content.
- **Image Proxying**: To bypass CORS restrictions when displaying external images (like Instagram profile pictures), the backend provides a `/api/proxy-image` endpoint.

### 4. Data Storage (Supabase)
- All persistent data, including competitor details, scraped datasets, and generated video metadata, is stored in **Supabase** (a PostgreSQL-based platform).
- The backend uses the `@supabase/supabase-js` client to perform CRUD operations on tables like `competitors` and `generated_videos`.

### 5. Automation & Webhooks
- The system can receive updates from external services (like HeyGen) via **webhooks** (`api/hygen/webhook`), which then update the status of tasks in the Supabase database.
