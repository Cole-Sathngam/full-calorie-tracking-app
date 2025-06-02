import React, { Component, ReactNode } from 'react';
import { AuthError } from '../contexts/AuthContext';

interface Props {
  children: ReactNode;
  fallback?: (error: AuthError, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: AuthError | null;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Convert generic error to AuthError format
    const authError: AuthError = {
      code: 'BOUNDARY_ERROR',
      message: error.message || 'An unexpected authentication error occurred',
      name: error.name || 'AuthError'
    };

    return {
      hasError: true,
      error: authError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#d63031', marginBottom: '10px' }}>
            🚨 Authentication Error
          </h2>
          <p style={{ color: '#2d3436', marginBottom: '15px' }}>
            <strong>Error:</strong> {this.state.error.message}
          </p>
          <p style={{ color: '#636e72', fontSize: '14px', marginBottom: '20px' }}>
            Code: {this.state.error.code}
          </p>
          <button
            onClick={this.retry}
            style={{
              backgroundColor: '#0984e3',
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
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary; 