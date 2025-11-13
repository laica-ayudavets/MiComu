import type { User } from "@/hooks/use-auth";

/**
 * Returns the canonical landing path for a user based on their role
 * @param user - The authenticated user object
 * @returns The landing path ("/superadmin" or "/")
 */
export function getRoleLandingPath(user: User | null | undefined): string {
  if (!user) return "/login";
  
  if (user.role === "superadmin") {
    return "/superadmin";
  }
  
  // All other roles (admin_fincas, presidente, vecino) go to community dashboard
  return "/";
}
