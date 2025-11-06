# Overview

This is a SaaS multi-tenant community management platform designed for Spanish residential communities (comunidades de vecinos). The application enables property managers and residents to manage incidents, documents, agreements, financial assessments (derramas), and service providers. It features AI-powered document analysis for automatically extracting agreements from meeting minutes.

The system is built as a full-stack TypeScript application with a modern React frontend, Express backend, and PostgreSQL database using Drizzle ORM. It follows a clean separation between client, server, and shared code with a focus on professional UI design inspired by Linear, Notion, and Stripe.

## Current Status (Last Updated: November 5, 2025)

**Completed Features:**
- ✅ **3-Tier Hierarchy System**: Refactored from 2-level to 3-level architecture
  - Property Management Companies (Administradores de Fincas) - Top level
  - Communities (Comunidades de Vecinos) - Middle level  
  - Users (Vecinos/Presidentes/Admin Fincas) - Bottom level
- ✅ Complete PostgreSQL database schema with property_companies and communities tables
- ✅ Updated role system: admin_fincas, presidente, vecino
- ✅ Full CRUD REST API for all entities (incidents, documents, agreements, derramas, providers, quotas)
- ✅ Community-scoped data isolation (all data belongs to a community)
- ✅ All 7 main pages connected to backend API with TanStack Query
- ✅ **Complete Security Hardening**: All business endpoints protected with requireAuth middleware
- ✅ **Role-Based Access Control**: Admin_fincas can switch between communities, presidente/vecino limited to their assigned community
- ✅ **Community Selector Component**: Fully functional selector in header for admin_fincas with session persistence
- ✅ **Dynamic Community Display**: Sidebar and UI components show current community name dynamically
- ✅ **Quotas Management System**: Complete module for tracking resident fees and payment status
  - Quota types definition with name, amount, frequency (monthly/quarterly/annual/one-time)
  - Quota assignments to individual residents with independent amounts and due dates
  - Payment status tracking (pending/paid/overdue)
  - Dual-tab interface for managing quota types and assignments
  - Full CRUD operations with validation and error handling
  - Backend data transformation to handle frontend/database type mismatches
  - E2E tested and verified working
- ✅ Professional UI with purple/orange glassmorphism design
- ✅ Form validation with Zod and react-hook-form
- ✅ Toast notifications for user feedback
- ✅ Loading states and error handling throughout

**Bug Fixes (November 5, 2025):**
- 🐛 **Fixed All Entity Creation**: Corrected ALL modules (Incidencias, Documentos, Acuerdos, Derramas, Proveedores) to use `communityId` instead of deprecated `tenantId`
  - All entities now properly link to a specific community
  - Added validation to ensure community is selected before creating entities
  - Updated form defaultValues to use `useCurrentCommunity` hook
  - Fixed both create and edit operations across all modules

**UX Improvements (November 6, 2025):**
- ✅ **Admin_fincas Community Selection Pattern**: When creating entities, admin_fincas users must explicitly select a community as the first field in the form
  - **Implemented in**: Incidencias, Acuerdos, Derramas
  - **Pending**: Documentos, Proveedores, Cuotas
  - Community field marked with asterisk (*) indicating it's required
  - Non-admin users (presidente, vecino) continue using their assigned community automatically
- ✅ **Enhanced Dashboard Statistics**: Dashboard now includes comprehensive financial and payment tracking
  - Total Derramas count (all derramas in the community)
  - Cuotas Impagadas count (unpaid quotas with status 'pendiente' or 'vencida')
  - Updated grid layout to accommodate 6 stat cards (3 columns)
  - Visual indicators with appropriate icons (Receipt for derramas, AlertTriangle for unpaid quotas)

**Recent Updates (November 5, 2025):**
- ✅ **Login Page**: Full authentication UI with email/password form, Zod validation, and automatic redirect
- ✅ **Protected Routes**: Automatic redirection to login for unauthenticated users
- ✅ **Comunidades Menu Item for Admin_fincas**: 
  - "Comunidades" menu item in sidebar (below Dashboard) visible only for admin_fincas
  - Full page at /comunidades showing all communities
  - Real-time search by community name
  - Real-time search by address (includes city and postal code)
  - Visual indication of active community with "Activa" badge
  - Click to select/switch between communities
  - Role-based authorization: Backend endpoints protected with requireRole("admin_fincas")
  - Client-side route protection: Non-admin users redirected to dashboard
  - Optimized queries with enabled flags based on user role
- ✅ **Comprehensive Filtering System**: Advanced filtering across all core modules
  - **Incidencias** (Incidents): Date range (desde/hasta), community (admin_fincas only), category, status
  - **Documentos** (Documents): Date range, community (admin_fincas only), document type
  - **Derramas** (Assessments): Date range, community (admin_fincas only)
  - **Acuerdos** (Agreements): Date range, community (admin_fincas only), status
  - Calendar component for intuitive date selection with Spanish locale
  - Clear buttons (X icon) for easy filter reset
  - Non-mutating date filtering to prevent state corruption
  - Community filter visible only for admin_fincas role
  - All filters work together with AND logic for precise data filtering
- ✅ **Quotas Module** (November 5, 2025): Complete implementation for tracking resident fees and debtors
  - Database schema with quota_types and quota_assignments tables
  - Quota types: customizable fees with name, description, amount, and frequency
  - Quota assignments: link residents to quotas with due dates, amounts, and payment status
  - Two-tab interface: manage quota types and view/create assignments
  - /api/users endpoint for listing residents in current community
  - Backend type transformation for decimal amounts and date handling
  - Full E2E testing completed and verified working
  - Assignment amounts are independent from quota type amounts (can be adjusted per resident)

**Pending Features:**
- ⏳ Role-based UI feature guards (hide/show features based on user role)
- ⏳ Property Companies and Communities CRUD UI (backend exists, UI pending)
- ⏳ File upload to object storage for documents
- ⏳ OpenAI integration for document analysis and agreement extraction
- ⏳ GoHighLevel and QuickBooks API integrations

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
- Property companies as top-level entities managing multiple communities
- Communities table with address, city, postal code
- User authentication linked to communities (or property companies for admin_fincas)
- Domain entities: incidents, documents, agreements, derramas, providers, quota_types, quota_assignments
- Enum types for status fields (incident_status, agreement_status, priority levels, quota_payment_status, frequency)
- UUID primary keys (varchar) with cascade deletion on community removal
- All domain entities scoped to communityId for multi-tenant isolation
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