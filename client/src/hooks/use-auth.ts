import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: "admin_fincas" | "presidente" | "vecino";
  communityId: string | null;
  propertyCompanyId: string;
  selectedCommunityId?: string | null;
}

export interface Community {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  totalUnits: number;
  presidentId: string | null;
  propertyCompanyId: string;
}

export function useUser() {
  return useQuery<User>({
    queryKey: ["/api/auth/me"],
  });
}

export function useCommunities() {
  return useQuery<Community[]>({
    queryKey: ["/api/auth/communities"],
  });
}

export function useCurrentCommunity() {
  return useQuery<Community | null>({
    queryKey: ["/api/auth/current-community"],
  });
}
