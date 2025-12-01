# Overview

This project is a multi-tenant SaaS platform for managing Spanish residential communities (comunidades de vecinos). It provides tools for property managers and residents to handle incidents, documents, agreements, financial assessments (derramas), and service providers. A key feature is AI-powered document analysis for extracting agreements from meeting minutes. The platform is a full-stack TypeScript application with a React frontend, Express backend, and PostgreSQL database, emphasizing a professional UI inspired by leading modern applications. The system supports a 4-tier hierarchy: Superadmin, Property Management Companies, Communities, and Users, ensuring robust multi-tenancy and role-based access control.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend is built with React 18 and TypeScript, using Vite. Routing is handled by Wouter, and server state management by TanStack Query. UI components are built using Shadcn/ui (based on Radix UI) and styled with Tailwind CSS, following a "New York" style variant and Inter font. React Hook Form with Zod is used for form management. The architecture is component-based, separating presentation from logic, with a shared layout and sidebar navigation.

## Backend

The backend uses Node.js with Express.js and TypeScript, providing a RESTful API with JSON responses. Session management is handled by `connect-pg-simple` for PostgreSQL-backed sessions. A robust multi-tenancy strategy is implemented at the database row level using `communityId` foreign keys, ensuring all queries are tenant-scoped. Error handling and request logging are standard.

## Data Layer

PostgreSQL (via Neon Serverless) is the database, accessed using Drizzle ORM for type-safe schema definitions. The schema supports a hierarchical structure: Property Companies manage multiple Communities, which in turn contain users and domain entities like incidents, documents, agreements, financial assessments, and quotas. All domain entities are scoped by `communityId` for multi-tenant isolation. UUIDs are used for primary keys, and Drizzle-Zod ensures runtime schema validation.

## UI/UX Decisions

The UI features a professional, modern design with a purple/orange glassmorphism theme, inspired by platforms like Linear, Notion, and Stripe. It includes features like toast notifications, loading states, error handling, and a dynamic community selector for property managers. Forms incorporate Zod validation and a clear pattern for community selection where applicable.

## Core Features Implemented

-   **4-Tier Hierarchy System**: Superadmin, Property Management Companies, Communities, Users.
-   **Superadmin Panel**: 
    -   CRUD for property companies and `admin_fincas` users
    -   **Custom Password Creation**: Superadmin can set custom passwords when creating admin_fincas users with strong validation (min 8 characters, uppercase, lowercase, number)
    -   Password visibility toggle for improved UX
    -   **Full Spanish Localization**: All superadmin interfaces (dashboard, companies management, admin users management) fully translated to Spanish with property management domain terminology
-   **Community Management** (Admin Fincas):
    -   Full CRUD operations for communities within user's property company
    -   Create new communities with name, address, city, postal code, province, and unit count
    -   Edit existing community details
    -   Delete communities with confirmation dialog
    -   Community selector to switch between managed communities
    -   Security: Admin can only manage communities within their own property company
-   **Role-Based Access Control**: Granular permissions for `superadmin`, `admin_fincas`, `presidente`, and `vecino` roles.
-   **Community-Scoped Data**: Strict data isolation per community.
-   **Quotas Management**: Comprehensive system for managing resident fees, payment statuses, and assignments.
-   **Meetings Management**: Module for managing community meetings, including agenda items, attendance, and minutes.
-   **Comprehensive Filtering**: Advanced filtering across all core modules (incidents, documents, agreements, financial assessments, meetings).
-   **Security Hardening**: 
    -   All business endpoints protected with authentication and authorization middleware
    -   Passwords hashed with scrypt before storage
    -   Passwords never returned in API responses

## Localization Strategy

The application implements **Spanish-only localization** using direct string replacement (no i18n library), appropriate for a Spanish market-focused product managing Spanish residential communities.

**Completed Translations:**
-   **Superadmin Dashboard** (`client/src/pages/superadmin.tsx`): Statistics cards, navigation cards, page headers
-   **Property Companies Management** (`client/src/pages/superadmin-companies.tsx`): Complete interface including forms, tables, dialogs, toasts, and validation messages
-   **Admin Users Management** (`client/src/pages/superadmin-admins.tsx`): Complete interface including create/edit forms, password change dialog, status badges, and all user-facing text
-   **Superadmin Sidebar** (`client/src/components/superadmin-sidebar.tsx`): Navigation menu with Spanish labels ("Resumen", "Empresas de Gestión", "Cuentas de Administrador")

**Translation Approach:**
-   Natural Spanish terminology for property management domain (e.g., "Empresa de Gestión", "Administrador de Fincas", "Comunidad de Vecinos")
-   Consistent with Spanish legal and administrative language
-   All form labels, buttons, validation messages, and toast notifications in Spanish
-   Maintained technical accuracy while ensuring clarity for non-technical users

# GoHighLevel CRM Integration

The platform integrates with GoHighLevel API 2.0 to automatically sync community and user data to the CRM.

## Configuration

Two environment secrets are required:
-   `GHL_API_KEY`: Private integration token for API authentication
-   `GHL_LOCATION_ID`: Sub-account/location ID where data is created

## Sync Behavior

**Communities → GHL Businesses**:
-   **Create**: When a new community is created, it's automatically synced as a Business record in GHL
-   **Update**: When community details change (name, address, city, province, postalCode), changes sync to GHL
-   **Delete**: When a community is deleted, the GHL Business is archived by renaming to "[ARCHIVADO] CommunityName" (not deleted)
-   Synced fields: name, address, city, state (province), postalCode, country (ES)
-   The GHL Business ID is stored in `communities.ghlBusinessId` for future reference
-   All sync operations are asynchronous and non-blocking

**Users → GHL Contacts**:
-   **Create**: When a new user is registered, they're synced as a Contact in GHL
-   **Update**: When user details change (fullName, email), changes sync to GHL
-   **Deactivate**: When a user is deactivated, the GHL Contact is tagged "Ex-Residente" (contacts are never deleted)
-   Synced fields: firstName, lastName, email, tags (based on role)
-   If user's community has a `ghlBusinessId`, the contact is linked via `companyId`
-   The GHL Contact ID is stored in `users.ghlContactId`
-   All sync operations are asynchronous and non-blocking

## API Endpoints

**Community GHL Sync**:
-   `POST /api/communities` → Creates GHL Business
-   `PATCH /api/communities/:id` → Updates GHL Business
-   `DELETE /api/communities/:id` → Archives GHL Business (prefixes name with "[ARCHIVADO]")

**User GHL Sync**:
-   `POST /api/auth/register` → Creates GHL Contact
-   `PATCH /api/users/:id` → Updates GHL Contact (admin_fincas only, community users)
-   `PATCH /api/superadmin/admins/:id` → Updates GHL Contact (superadmin only, admin users)
-   `POST /api/users/:id/deactivate` → Tags GHL Contact as "Ex-Residente" (admin_fincas only)
-   `POST /api/superadmin/admins/:id/deactivate` → Tags GHL Contact as "Ex-Residente" (superadmin only)

## Implementation Files

-   `server/ghl.ts`: GHL API service with create/update/archive/deactivate functions
-   `server/routes.ts`: Integration points in all CRUD endpoints
-   `server/storage.ts`: `updateCommunityGHLId()` and `updateUserGHLId()` functions
-   `shared/schema.ts`: `ghlBusinessId` and `ghlContactId` columns

## Error Handling

-   GHL sync failures are logged but don't block the main application flow
-   If GHL credentials are not configured, sync is silently skipped
-   Failed syncs can be retried manually or through future batch sync functionality
-   All sync is performed with proper authorization checks (community ownership verification)

# External Dependencies

-   **Database**: Neon Serverless PostgreSQL
-   **CRM Integration**: GoHighLevel API 2.0
-   **UI Components**: Radix UI, Shadcn/ui, Lucide React (icons)
-   **Form Handling**: React Hook Form, Zod, Hookform Resolvers
-   **Date Management**: Date-fns
-   **Styling**: Tailwind CSS, PostCSS, Class Variance Authority, CLSX, Tailwind Merge
-   **Development Tools**: Vite, TypeScript, ESBuild, Drizzle Kit
-   **Session Management**: `connect-pg-simple`

# Authentication & Navigation

## Role-Based Redirects

The application implements automatic role-based redirects to ensure users land on the correct dashboard after login:

-   **Superadmin** (`role: "superadmin"`): Automatically redirects to `/superadmin` dashboard
-   **Admin Fincas** (`role: "admin_fincas"`): Redirects to `/` (community dashboard)
-   **Presidente** (`role: "presidente"`): Redirects to `/` (community dashboard)
-   **Vecino** (`role: "vecino"`): Redirects to `/` (community dashboard)

This is implemented via:
-   `getRoleLandingPath()` helper function in `client/src/lib/role-helpers.ts`
-   Login page (`client/src/pages/login.tsx`) uses this helper for post-login navigation
-   AppLayout (`client/src/App.tsx`) guards against role mismatches:
    -   Prevents non-superadmin users from accessing `/superadmin` routes
    -   Redirects superadmin users away from community routes back to `/superadmin`

## Test Credentials

The platform includes pre-configured test users for all roles (created via `ensureDefaultData()` on server startup):

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Superadmin | superadmin@administra.com | password | Full platform access, property companies CRUD, admin users management |
| Admin Fincas | admin@gestiona.com | password | Multi-community management, all community features |
| Presidente | presidente@lasflores.com | password | Single community management, elevated permissions |
| Vecino | vecino@lasflores.com | password | Single community access, resident features |

**Password Auto-Repair**: The system automatically updates passwords on startup if they don't match the configured values (via scrypt hash verification).

## Login & Navigation

**Login Flow:**
- Login page (`client/src/pages/login.tsx`) displays test credentials for all roles including superadmin
- After successful authentication, users are immediately redirected to their role-specific landing page:
  - Superadmin → `/superadmin`
  - Admin Fincas/Presidente/Vecino → `/` (community dashboard)
- The login response is parsed (`await res.json()`) and used for immediate redirect via `getRoleLandingPath(user)`
- Auth cache is invalidated after login to ensure fresh user data
- Fallback useEffect provides additional redirect safety if immediate redirect fails