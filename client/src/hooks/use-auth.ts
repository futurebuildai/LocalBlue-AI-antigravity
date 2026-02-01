import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";

export function useAuth() {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { isLoaded: isAuthLoaded, userId, orgId, orgRole } = useClerkAuth();

  const isLoading = !isUserLoaded || !isAuthLoaded;
  const isAuthenticated = isSignedIn === true;

  return {
    user,
    userId,
    orgId,
    orgRole,
    isLoading,
    isAuthenticated,
    isSignedIn,
  };
}
