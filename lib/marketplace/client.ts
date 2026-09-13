'use client';
import { useAuth } from '../auth/use-auth';
export { marketplaceRequest } from '../auth/request';

/** Existing action callers share the single auth provider; only user gestures call login. */
export function useWalletSession() {
  return useAuth().login;
}
