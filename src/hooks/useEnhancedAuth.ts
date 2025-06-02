import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface SessionInfo {
  isValid: boolean;
  expiresAt: Date | null;
  timeUntilExpiry: number | null;
  isExpiringSoon: boolean; // < 5 minutes remaining
}

interface AuthError {
  code: string;
  message: string;
  timestamp: Date;
}

export const useEnhancedAuth = () => {
  const amplifyAuth = useAuthenticator(); // Use Amplify as source of truth
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isValid: false,
    expiresAt: null,
    timeUntilExpiry: null,
    isExpiringSoon: false
  });
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check session details
  const checkSession = async () => {
    if (!amplifyAuth.user) {
      setSessionInfo({
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
        isExpiringSoon: false
      });
      return;
    }

    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;

      if (!accessToken || !accessToken.payload.exp) {
        setSessionInfo({
          isValid: false,
          expiresAt: null,
          timeUntilExpiry: null,
          isExpiringSoon: false
        });
        return;
      }

      const now = new Date();
      const expiresAt = new Date(accessToken.payload.exp * 1000);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const isExpiringSoon = timeUntilExpiry <= 5 * 60 * 1000; // 5 minutes
      const isValid = timeUntilExpiry > 0;

      setSessionInfo({
        isValid,
        expiresAt,
        timeUntilExpiry,
        isExpiringSoon
      });

      // Auto-refresh if expiring soon
      if (isExpiringSoon && isValid && !isRefreshing) {
        refreshSession();
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setAuthError({
        code: 'SESSION_CHECK_FAILED',
        message: 'Failed to check session status',
        timestamp: new Date()
      });
    }
  };

  // Refresh session
  const refreshSession = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      setAuthError(null);
      
      // Force refresh the session
      await fetchAuthSession({ forceRefresh: true });
      await checkSession();
      
      console.log('✅ Session refreshed automatically');
    } catch (error) {
      console.error('❌ Failed to refresh session:', error);
      setAuthError({
        code: 'REFRESH_FAILED',
        message: 'Failed to refresh session. Please sign in again.',
        timestamp: new Date()
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear error
  const clearError = () => {
    setAuthError(null);
  };

  // Listen to auth events
  useEffect(() => {
    const hubListener = (data: { channel: string; payload: { event: string; data?: unknown } }) => {
      const { channel, payload } = data;
      
      if (channel === 'auth') {
        console.log('🔔 Auth event:', payload.event);
        
        switch (payload.event) {
          case 'signedIn':
            setAuthError(null);
            checkSession();
            break;
          case 'signedOut':
            setSessionInfo({
              isValid: false,
              expiresAt: null,
              timeUntilExpiry: null,
              isExpiringSoon: false
            });
            setAuthError(null);
            break;
          case 'tokenRefresh':
            checkSession();
            break;
          case 'tokenRefresh_failure':
            setAuthError({
              code: 'TOKEN_REFRESH_FAILED',
              message: 'Token refresh failed. Please sign in again.',
              timestamp: new Date()
            });
            break;
          case 'signIn_failure':
            setAuthError({
              code: 'SIGNIN_FAILED',
              message: payload.data?.toString() || 'Sign in failed',
              timestamp: new Date()
            });
            break;
        }
      }
    };

    const unsubscribe = Hub.listen('auth', hubListener);

    // Initial session check
    if (amplifyAuth.user) {
      checkSession();
    }

    // Periodic session check (every 30 seconds)
    const interval = setInterval(() => {
      if (amplifyAuth.user) {
        checkSession();
      }
    }, 30 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [amplifyAuth.user, isRefreshing]);

  return {
    // Pass through all Amplify auth properties
    ...amplifyAuth,
    
    // Add our enhancements
    sessionInfo,
    authError,
    isRefreshing,
    refreshSession,
    clearError,
    checkSession
  };
}; 