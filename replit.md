# Overview

This is a SaaS multi-tenant community management platform designed for Spanish residential communities (comunidades de vecinos). The application enables property managers and residents to manage incidents, documents, agreements, financial assessments (derramas), and service providers. It features AI-powered document analysis for automatically extracting agreements from meeting minutes.

The system is built as a full-stack TypeScript application with a modern React frontend, Express backend, and PostgreSQL database using Drizzle ORM. It follows a clean separation between client, server, and shared code with a focus on professional UI design inspired by Linear, Notion, and Stripe.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**Routing**: Wouter for lightweight client-side routing

**State Management**: 
- TanStack Query (React Query) for server state management
- React Hook Form with Zod validation for form state
- Local component state with React hooks

**UI Component System**:
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design system
- "New York" style variant with neutral base color
- Custom CSS variables for theming (light/dark mode support)
- Inter font family as primary typeface

**Design Patterns**:
- Component-based architecture with reusable UI components
- Page components for route handlers
- Shared layout wrapper with sidebar navigation
- Separation of presentation components from page logic

## Backend Architecture

**Runtime**: Node.js with TypeScript (ESM modules)

**Framework**: Express.js for HTTP server

**API Design**: RESTful API with JSON responses
- Routes organized in `/api/*` namespace
- Centralized route registration pattern
- Request/response logging middleware
- Error handling with status code propagation

**Session Management**: 
- Session storage using connect-pg-simple with PostgreSQL
- Session data persisted in database for multi-instance scalability

**Multi-tenancy Strategy**:
- Tenant isolation at database row level using `tenantId` foreign keys
- Default demo tenant created on startup
- Domain-based tenant resolution (prepared for custom domains)
- All queries scoped to tenant context

## Data Layer

**Database**: PostgreSQL (via Neon serverless with WebSocket support)

**ORM**: Drizzle ORM with type-safe schema definitions

**Schema Design**:
- Tenant table as root entity with branding configuration
- User authentication linked to tenants
- Domain entities: incidents, documents, agreements, derramas, providers
- Enum types for status fields (incident_status, agreement_status, priority levels)
- UUID primary keys with cascade deletion on tenant removal
- Timestamps for audit trail

**Validation**: Drizzle-Zod integration for runtime schema validation matching database schema

**Migration Strategy**: Schema-first with Drizzle Kit push for development

**Storage Abstraction**: 
- Storage interface pattern for database operations
- Centralized query logic with tenant-scoped methods
- Type-safe CRUD operations using Drizzle's query builder

## External Dependencies

**Database Service**: Neon Serverless PostgreSQL
- WebSocket-based connection pooling
- Environment variable configuration via `DATABASE_URL`

**UI Component Library**: 
- Radix UI for accessible component primitives
- Shadcn/ui for pre-styled components
- Lucide React for icons

**Form Handling**:
- React Hook Form for form state management
- Hookform Resolvers for Zod schema integration
- Date-fns for date manipulation and formatting

**Development Tools**:
- Replit-specific plugins (vite-plugin-runtime-error-modal, cartographer, dev-banner)
- TypeScript for type safety
- ESBuild for production server bundling

**Styling**:
- Tailwind CSS with PostCSS
- Class Variance Authority for component variants
- CLSX and Tailwind Merge for className composition

**Design System Assets**: Custom generated images stored in attached_assets directory for landing page