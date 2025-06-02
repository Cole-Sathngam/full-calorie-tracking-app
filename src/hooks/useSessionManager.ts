import { useState, useEffect, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthContext } from '../contexts/AuthContext';

interface SessionInfo {
  isValid: boolean;
  expiresAt: Date | null;
  timeUntilExpiry: number | null; // in milliseconds
  isExpiringSoon: boolean; // expires within 5 minutes
}

interface SessionManagerState {
  sessionInfo: SessionInfo;
  isOnline: boolean;
  isRefreshing: boolean;
  lastRefresh: Date | null;
  error: string | null;
}

export const useSessionManager = () => {
  const { user, refreshSession, error: authError } = useAuthContext();
  const [state, setState] = useState<SessionManagerState>({
    sessionInfo: {
      isValid: false,
      expiresAt: null,
      timeUntilExpiry: null,
      isExpiringSoon: false
    },
    isOnline: navigator.onLine,
    isRefreshing: false,
    lastRefresh: null,
    error: null
  });

  // Check session validity
  const checkSession = useCallback(async (): Promise<SessionInfo> => {
    try {
      if (!user) {
        return {
          isValid: false,
          expiresAt: null,
          timeUntilExpiry: null,
          isExpiringSoon: false
        };
      }

      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;

      if (!accessToken || !accessToken.payload.exp) {
        return {
          isValid: false,
          expiresAt: null,
          timeUntilExpiry: null,
          isExpiringSoon: false
        };
      }

      const now = new Date();
      const expiresAt = new Date(accessToken.payload.exp * 1000);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const isExpiringSoon = timeUntilExpiry <= 5 * 60 * 1000; // 5 minutes
      const isValid = timeUntilExpiry > 0;

      return {
        isValid,
        expiresAt,
        timeUntilExpiry,
        isExpiringSoon
      };
    } catch (error) {
      console.error('Session check failed:', error);
      return {
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
        isExpiringSoon: false
      };
    }
  }, [user]);

  // Auto refresh session if expiring soon
  const autoRefreshSession = useCallback(async () => {
    if (state.isRefreshing || !state.sessionInfo.isExpiringSoon || !state.isOnline) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      
      console.log('🔄 Auto-refreshing session (expires soon)...');
      await refreshSession();
      
      const newSessionInfo = await checkSession();
      setState(prev => ({
        ...prev,
        sessionInfo: newSessionInfo,
        isRefreshing: false,
        lastRefresh: new Date(),
        error: null
      }));
      
      console.log('✅ Session auto-refreshed successfully');
    } catch (error) {
      console.error('❌ Auto-refresh failed:', error);
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: 'Failed to refresh session automatically'
      }));
    }
  }, [state.isRefreshing, state.sessionInfo.isExpiringSoon, state.isOnline, refreshSession, checkSession]);

  // Manual session refresh
  const manualRefreshSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      
      await refreshSession();
      const newSessionInfo = await checkSession();
      
      setState(prev => ({
        ...prev,
        sessionInfo: newSessionInfo,
        isRefreshing: false,
        lastRefresh: new Date(),
        error: null
      }));
      
      return true;
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: 'Failed to refresh session'
      }));
      return false;
    }
  }, [refreshSession, checkSession]);

  // Clear session error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Update session info periodically
  useEffect(() => {
    const updateSessionInfo = async () => {
      if (user) {
        const sessionInfo = await checkSession();
        setState(prev => ({ ...prev, sessionInfo }));
      }
    };

    updateSessionInfo();

    // Check every 30 seconds
    const interval = setInterval(updateSessionInfo, 30 * 1000);
    return () => clearInterval(interval);
  }, [user, checkSession]);

  // Auto-refresh when session is expiring soon
  useEffect(() => {
    if (state.sessionInfo.isExpiringSoon && state.sessionInfo.isValid) {
      autoRefreshSession();
    }
  }, [state.sessionInfo.isExpiringSoon, state.sessionInfo.isValid, autoRefreshSession]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      console.log('🌐 Back online - resuming session management');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.log('📵 Gone offline - pausing session management');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update auth error from context
  useEffect(() => {
    if (authError) {
      setState(prev => ({
        ...prev,
        error: authError.message,
        sessionInfo: {
          isValid: false,
          expiresAt: null,
          timeUntilExpiry: null,
          isExpiringSoon: false
        }
      }));
    }
  }, [authError]);

  return {
    ...state,
    refreshSession: manualRefreshSession,
    clearError,
    checkSession
  };
}; 