import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, signOut as amplifySignOut, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// Types for better TypeScript support
export interface AuthUser {
  username: string;
  email?: string;
  userId: string;
  signInDetails?: any;
}

export interface AuthError {
  code: string;
  message: string;
  name: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  sessionExpired: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  checkAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const isAuthenticated = !!user && !sessionExpired;

  const clearError = () => {
    setError(null);
    setSessionExpired(false);
  };

  const handleAuthError = (authError: any) => {
    console.error('Authentication error:', authError);
    
    const errorObj: AuthError = {
      code: authError.code || authError.name || 'UNKNOWN_ERROR',
      message: authError.message || 'An unknown authentication error occurred',
      name: authError.name || 'AuthError'
    };

    setError(errorObj);

    // Handle specific error types
    switch (authError.code || authError.name) {
      case 'NotAuthorizedException':
      case 'TokenExpiredException':
      case 'CredentialsError':
        setSessionExpired(true);
        setUser(null);
        break;
      case 'NetworkError':
        // Don't clear user on network errors, might be temporary
        break;
      case 'UserNotConfirmedException':
        // Handle unconfirmed user
        break;
      default:
        // For unknown errors, be cautious and clear user
        setUser(null);
    }
  };

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        const authUser: AuthUser = {
          username: currentUser.username,
          email: currentUser.signInDetails?.loginId,
          userId: currentUser.userId,
          signInDetails: currentUser.signInDetails
        };
        
        setUser(authUser);
        setSessionExpired(false);
      } else {
        setUser(null);
      }
    } catch (authError: any) {
      handleAuthError(authError);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      clearError();
      const session = await fetchAuthSession({ forceRefresh: true });
      
      if (session.tokens) {
        // Session refreshed successfully
        await checkAuthState();
        console.log('✅ Session refreshed successfully');
      } else {
        throw new Error('Failed to refresh session - no tokens received');
      }
    } catch (authError: any) {
      console.error('❌ Failed to refresh session:', authError);
      handleAuthError(authError);
      throw authError;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      await amplifySignOut();
      setUser(null);
      setSessionExpired(false);
      
      console.log('✅ User signed out successfully');
    } catch (authError: any) {
      console.error('❌ Error during sign out:', authError);
      handleAuthError(authError);
      // Even if sign out fails, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to authentication events
  useEffect(() => {
    // Initial auth check
    checkAuthState();

    // Set up Hub listener for auth events
    const hubListener = (data: any) => {
      const { channel, payload } = data;
      
      if (channel === 'auth') {
        console.log('🔔 Auth event received:', payload.event);
        
        switch (payload.event) {
          case 'signedIn':
            console.log('✅ User signed in');
            checkAuthState();
            break;
          case 'signedOut':
            console.log('👋 User signed out');
            setUser(null);
            setSessionExpired(false);
            clearError();
            break;
          case 'tokenRefresh':
            console.log('🔄 Token refreshed');
            checkAuthState();
            break;
          case 'tokenRefresh_failure':
            console.log('❌ Token refresh failed');
            handleAuthError(payload.data);
            break;
          case 'signIn_failure':
            console.log('❌ Sign in failed');
            handleAuthError(payload.data);
            break;
          default:
            console.log('🔔 Other auth event:', payload.event);
        }
      }
    };

    const unsubscribe = Hub.listen('auth', hubListener);

    // Set up periodic session check (every 5 minutes)
    const sessionCheck = setInterval(async () => {
      if (user && !sessionExpired) {
        try {
          await fetchAuthSession();
        } catch (authError: any) {
          console.warn('⚠️ Session check failed:', authError);
          handleAuthError(authError);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup
    return () => {
      unsubscribe();
      clearInterval(sessionCheck);
    };
  }, [user, sessionExpired]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    sessionExpired,
    signOut,
    refreshSession,
    clearError,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 