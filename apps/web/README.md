# Noda Copilot Dashboard Frontend

This is the main dashboard application for the Noda Turbo project, built with Next.js (App Router), React, and Apollo Client. It's responsible for fetching and visualizing data from the GraphQL API in real-time.

## Overview

The dashboard provides interactive charts and data displays to monitor key metrics related to your building and asset data. It leverages server-side rendering (SSR) and static site generation (SSG) capabilities of Next.js for optimal performance and SEO, with client-side interactivity powered by React and Apollo Client.

## Features

* **Dynamic Data Visualization:** Displays various charts (powered by Recharts and D3.js) and tables for building/asset performance data.
* **Real-time Updates:** Subscribes to GraphQL updates for live data changes.
* **Efficient Data Fetching:** Utilizes Next.js App Router's Server Components for initial data loads and Apollo Client hooks for client-side interactions and real-time data.
* **Responsive Design:** Built with Tailwind CSS for a consistent and adaptive user experience across devices.
* **Form Management:** Integrates `react-hook-form` and `zod` for robust form validation (if applicable to future features).
* **State Management:** Uses `zustand` for lightweight client-side state management.

## Technologies Used

* [Next.js 15 (App Router)](https://nextjs.org/)
* [React 19](https://react.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [Apollo Client](https://www.apollographql.com/docs/react/)
* [Recharts](https://recharts.org/)
* [D3.js](https://d3js.org/)
* [Tailwind CSS](https://tailwindcss.com/) (managed via `@repo/tailwind-config`)
* [Zustand](https://zustand-zustand.vercel.app/)
* [React Hook Form](https://react-hook-form.com/)
* [Zod](https://zod.dev/)
* [Leaflet & React-Leaflet](https://react-leaflet.js.org/) (for map visualizations)
* [Lucide React](https://lucide.dev/) (for icons)
* Shared packages from `@repo/` (ESLint, TypeScript configs, UI components)

## Getting Started

Make sure you have followed the [Monorepo Root README](../README.md) for overall setup, including installing `pnpm` and Docker Compose.

### 1. Install Dependencies (from Monorepo Root)

Ensure all monorepo dependencies are installed:

```
# From noda_turbo/ root
pnpm install
```

### 2\. Configure Environment Variables

Create a local `.env` file for your frontend:

```bash
# From apps/dashboard-frontend/
cp .env.example .env.local
```

Update `.env.local` with your GraphQL API endpoint (once the API is running). Example:
`NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql`

### 3\. Run the Development Server


#### From noda_turbo/ root
```bash
pnpm --filter=dashboard-frontend dev
# or, from apps/dashboard-frontend/
# pnpm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) (or the port specified by Next.js) in your browser to see the dashboard.

## Data Flow

The dashboard fetches data primarily from the GraphQL API:

  * **Initial Data:** Fetched using Next.js Server Components for fast page loads.
  * **Interactive Data:** Fetched on the client-side using `useQuery` hooks from Apollo Client for filtering, sorting, etc.
  * **Real-time Data:** Subscribes to GraphQL Subscriptions via WebSockets for live updates (`useSubscription` hooks).

## Project Structure

```
dashboard-frontend/
├── public/                 # Static assets (images, fonts)
├── app/                    # Next.js App Router directory
│   ├── favicon.ico
│   ├── globals.css         # Global styles (imported in layout.tsx)
│   ├── layout.tsx          # Root layout, ApolloProvider setup
│   └── page.tsx            # Main dashboard page, Server Component for initial data
├── components/             # Reusable React components (e.g., Chart components, UI elements)
├── lib/                    # Client-side Apollo Client setup, utility functions
│   └── apolloClient.ts     # Apollo Client configuration
├── styles/                 # Component-specific styles (if any)
├── __tests__/              # Unit and integration tests for frontend components
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md               # This file
```