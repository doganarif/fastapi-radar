# FastAPI Radar Dashboard

The FastAPI Radar dashboard is a React application built with Vite, TypeScript, and shadcn/ui components.

## Pre-built Dashboard

The dashboard comes **pre-built** in the `dist/` folder. End users don't need to build it - it's included in the Python package and served automatically.

## Development

If you're contributing to the dashboard UI:

### Setup

```bash
npm install
```

### Development Server

Run the development server with hot reload:

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173/__radar/`

**Note:** Make sure your FastAPI app is running on port 8000, as the development server proxies API calls there.

### Building for Production

After making changes, rebuild the production bundle:

```bash
npm run build
```

This creates optimized files in the `dist/` folder that will be included in the Python package.

## Important Notes

- The `dist/` folder is **tracked in git** (not ignored)
- Always rebuild before committing dashboard changes
- The base path is `/__radar/` (configured in `vite.config.ts`)
- All API calls go to `/api/radar/*` endpoints

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching
- **React Router** - Routing
- **Recharts** - Charts
