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
-   **Superadmin Panel**: CRUD for property companies and `admin_fincas` users.
-   **Role-Based Access Control**: Granular permissions for `superadmin`, `admin_fincas`, `presidente`, and `vecino` roles.
-   **Community-Scoped Data**: Strict data isolation per community.
-   **Quotas Management**: Comprehensive system for managing resident fees, payment statuses, and assignments.
-   **Meetings Management**: Module for managing community meetings, including agenda items, attendance, and minutes.
-   **Comprehensive Filtering**: Advanced filtering across all core modules (incidents, documents, agreements, financial assessments, meetings).
-   **Security Hardening**: All business endpoints protected with authentication and authorization middleware.

# External Dependencies

-   **Database**: Neon Serverless PostgreSQL
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