'use client';
import { FirebaseContext } from '@/firebase/provider';
import type { UserHookResult } from '@/firebase/provider';
import { useContext } from 'react';

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserAuthHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }

  const { user, isUserLoading, userError } = context;
  return { user, isUserLoading, userError };
};
