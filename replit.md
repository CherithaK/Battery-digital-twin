# Battery Health Digital Twin

## Overview

This is a research-grade Battery Health Digital Twin application implementing the estimation, diagnostics, and decision-support layer of a Battery Management System (BMS). The system focuses on Cyclic Voltammetry (CV) analysis for electrochemical research, providing state estimation, degradation diagnostics, operating envelope awareness, and advisory decision support.

The application is designed for academic presentation, project evaluation, and viva defense contexts. It does NOT perform hardware control, protection, or balancing - it focuses exclusively on BMS intelligence and analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Component Library**: shadcn/ui (New York style) with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **3D Visualization**: React Three Fiber with Drei helpers for electrochemical cell visualization
- **Design System**: Fluent Design System approach optimized for data-dense dashboards

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: REST endpoints under `/api/` prefix
- **Data Processing**: Custom CSV parsing and electrochemical analysis algorithms
- **Storage**: In-memory storage (MemStorage class) with interface for future database integration

### Data Flow
1. User uploads CSV files containing cyclic voltammetry data (cycle, voltage, current columns)
2. Backend parses CSV and extracts electrochemical metrics (peak currents, potentials, reversibility)
3. Analysis results include ML estimates for State of Health (SoH) and BMS intelligence metrics
4. Frontend displays data through interactive charts, gauges, and 3D visualizations

### Key Design Patterns
- **Shared Types**: TypeScript interfaces defined in `shared/schema.ts` used by both frontend and backend
- **Component Composition**: Atomic UI components in `client/src/components/ui/` composed into feature components
- **Path Aliases**: `@/` for client source, `@shared/` for shared code, `@assets/` for attached assets

### Database Schema
- Uses Drizzle ORM with PostgreSQL dialect configured
- User authentication table defined (`users` with id, username, password)
- Analysis results stored in memory but schema supports future persistence

## External Dependencies

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and migrations in `./migrations` directory

### Frontend Libraries
- **Recharts**: Chart visualization (via shadcn/ui chart component)
- **Three.js**: 3D rendering for electrochemical cell visualization
- **React Hook Form**: Form handling with Zod validation

### Build & Development
- **Vite**: Development server with HMR
- **esbuild**: Production server bundling
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, dropdown, tooltip, etc.)
- **Lucide Icons**: Icon library
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Tailwind class merging utility