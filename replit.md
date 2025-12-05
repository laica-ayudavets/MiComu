# Overview

This project is a multi-tenant SaaS platform for managing Spanish residential communities. It offers tools for property managers and residents to handle incidents, documents, agreements, financial assessments, and service providers. A key feature is AI-powered document analysis for extracting agreements from meeting minutes. The platform is a full-stack TypeScript application with a React frontend, Express backend, and PostgreSQL database, emphasizing a professional UI. It supports a 4-tier hierarchy: Superadmin, Property Management Companies, Communities, and Users, ensuring robust multi-tenancy and role-based access control.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions

The UI features a professional, modern design with a purple/orange glassmorphism theme, inspired by platforms like Linear, Notion, and Stripe. It includes toast notifications, loading states, error handling, and a dynamic community selector. Forms incorporate Zod validation and a clear pattern for community selection. The application is fully localized in Spanish, using natural terminology for the property management domain.

## Technical Implementations

The frontend uses React 18, TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI components are built with Shadcn/ui (Radix UI) and styled with Tailwind CSS, following a "New York" style variant. Forms are managed with React Hook Form and Zod.

The backend uses Node.js with Express.js and TypeScript, providing a RESTful API. Session management is handled by `connect-pg-simple`. PostgreSQL (Neon Serverless) is the database, accessed via Drizzle ORM for type-safe schema definitions. Multi-tenancy is implemented at the database row level using `communityId` foreign keys.

## Feature Specifications

-   **4-Tier Hierarchy System**: Superadmin, Property Management Companies, Communities, Users with role-based access control.
-   **Superadmin Panel**: CRUD for property companies and `admin_fincas` users, including custom password creation with strong validation and full Spanish localization.
-   **Community Management**: Full CRUD for communities, including community selection and security to manage only owned communities.
-   **User Management**: Vecinos management, including creation, editing, community reassignment, password reset, deactivation/reactivation, and filtering. Changes sync to GoHighLevel CRM.
-   **User Self-Service**: Users can update their contact information, with changes syncing to GoHighLevel CRM.
-   **Community-Scoped Data**: Strict data isolation per community for all entities.
-   **Quotas Management**: Comprehensive system for managing resident fees, payment statuses, bulk invoice generation, and invoice history for residents. Integrates with Holded for invoice syncing.
-   **Meetings Management**: Module for managing community meetings, agenda items, attendance, and minutes.
-   **Comprehensive Filtering**: Advanced filtering across all core modules.
-   **Security Hardening**: All business endpoints protected with authentication/authorization, scrypt for password hashing, and no password return in API responses.

## System Design Choices

The application implements automatic role-based redirects post-login to ensure users land on their respective dashboards. Test credentials are pre-configured for all roles, and the system includes password auto-repair on startup.

# External Dependencies

-   **Database**: Neon Serverless PostgreSQL
-   **CRM Integration**: GoHighLevel API 2.0 (for syncing community and user data)
-   **Invoice Integration**: Holded (for syncing quota assignments as invoices)
-   **UI Components**: Radix UI, Shadcn/ui, Lucide React
-   **Form Handling**: React Hook Form, Zod
-   **Date Management**: Date-fns
-   **Styling**: Tailwind CSS
-   **Session Management**: `connect-pg-simple`