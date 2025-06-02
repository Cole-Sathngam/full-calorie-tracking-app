import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requireAuth = true
}) => {
  const {
    isAuthenticated,
    isLoading,
    error,
    sessionExpired,
    refreshSession,
    clearError
  } = useAuthContext();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Handle session expiration
  if (sessionExpired) {
    return (
      <div style={{
        padding: '20px',
        margin: '20px auto',
        maxWidth: '400px',
        border: '2px solid #f39c12',
        borderRadius: '8px',
        backgroundColor: '#fef9e7',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#d68910', marginBottom: '15px' }}>
          ⏰ Session Expired
        </h3>
        <p style={{ color: '#7d6608', marginBottom: '20px' }}>
          Your session has expired. Please refresh your session or sign in again.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => refreshSession()}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Session
          </button>
          <button
            onClick={clearError}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ❌ Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={clearError}
        title="Authentication Error"
      />
    );
  }

  // Check if authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div style={{
        padding: '20px',
        margin: '20px auto',
        maxWidth: '400px',
        border: '2px solid #e74c3c',
        borderRadius: '8px',
        backgroundColor: '#fadbd8',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#c0392b', marginBottom: '15px' }}>
          🔒 Authentication Required
        </h3>
        <p style={{ color: '#922b21', marginBottom: '15px' }}>
          You need to sign in to access this content.
        </p>
        <p style={{ color: '#6c2116', fontSize: '14px' }}>
          Please use the sign-in form above to authenticate.
        </p>
      </div>
    );
  }

  // User is authenticated or authentication is not required
  return <>{children}</>;
};

export default ProtectedRoute; 