import { useQuery } from "@tanstack/react-query";
import type { Community } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  unitNumber: string | null;
  role: "superadmin" | "admin_fincas" | "presidente" | "vecino";
  communityId: string | null;
  propertyCompanyId: string | null;
  selectedCommunityId?: string | null;
  active: boolean;
  ghlContactId?: string | null;
}

export type { Community };

export function useUser() {
  return useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });
}

export function useCommunities() {
  const { data: user } = useUser();
  return useQuery<Community[]>({
    queryKey: ["/api/auth/communities"],
    enabled: user?.role === "admin_fincas",
  });
}

export function useCurrentCommunity() {
  const { data: user } = useUser();
  return useQuery<Community | null>({
    queryKey: ["/api/auth/current-community"],
    enabled: !!user,
  });
}
