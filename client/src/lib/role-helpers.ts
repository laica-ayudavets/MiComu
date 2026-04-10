import type { User } from "@/hooks/use-auth";

export function getRoleLandingPath(user: User | null | undefined): string {
  if (!user) return "/login";
  
  if (user.role === "superadmin") {
    return "/superadmin";
  }
  
  return "/";
}
