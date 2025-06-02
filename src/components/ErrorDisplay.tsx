import React from 'react';

interface AuthError {
  code: string;
  name: string;
  message: string;
}

interface ErrorDisplayProps {
  error: AuthError;
  onRetry?: () => void;
  title?: string;
  showRetry?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title = 'Error',
  showRetry = true
}) => {
  const getErrorIcon = (errorCode: string) => {
    switch (errorCode) {
      case 'NetworkError':
        return '🌐';
      case 'NotAuthorizedException':
      case 'TokenExpiredException':
        return '🔐';
      case 'UserNotConfirmedException':
        return '📧';
      default:
        return '⚠️';
    }
  };

  const getErrorSuggestion = (errorCode: string) => {
    switch (errorCode) {
      case 'NetworkError':
        return 'Please check your internet connection and try again.';
      case 'NotAuthorizedException':
        return 'Please check your credentials and try signing in again.';
      case 'TokenExpiredException':
        return 'Your session has expired. Please sign in again.';
      case 'UserNotConfirmedException':
        return 'Please check your email and confirm your account.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px auto',
      maxWidth: '500px',
      border: '2px solid #e74c3c',
      borderRadius: '8px',
      backgroundColor: '#fadbd8',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '15px' }}>
        {getErrorIcon(error.code)}
      </div>
      
      <h3 style={{ color: '#c0392b', marginBottom: '15px' }}>
        {title}
      </h3>
      
      <p style={{ color: '#922b21', marginBottom: '10px', fontWeight: 'bold' }}>
        {error.message}
      </p>
      
      <p style={{ color: '#6c2116', fontSize: '14px', marginBottom: '15px' }}>
        {getErrorSuggestion(error.code)}
      </p>
      
      <details style={{ marginBottom: '20px', textAlign: 'left' }}>
        <summary style={{ 
          cursor: 'pointer', 
          color: '#7d2d3a',
          fontSize: '14px'
        }}>
          Technical Details
        </summary>
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#f8d7da',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Error Code:</strong> {error.code}<br />
          <strong>Error Name:</strong> {error.name}<br />
          <strong>Message:</strong> {error.message}
        </div>
      </details>
      
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay; 