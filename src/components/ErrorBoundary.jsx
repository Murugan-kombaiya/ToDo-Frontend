import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Send error to logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Send error to logging service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // You can integrate with services like Sentry, LogRocket, etc.
    console.log('Error logged:', errorData);
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="error-boundary" style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          margin: '2rem',
          color: '#721c24'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
          </div>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            Something went wrong! 😵
          </h2>

          <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Don't worry! This error has been logged and our team will look into it.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary me-2"
              style={{ marginRight: '0.5rem' }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="btn btn-outline-secondary"
            >
              Reload Page
            </button>
          </div>

          {isDevelopment && this.state.error && (
            <details style={{
              textAlign: 'left',
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              marginTop: '1rem',
              fontSize: '0.9rem',
              fontFamily: 'monospace'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                padding: '0.5rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
