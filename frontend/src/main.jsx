import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application Error Boundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = window.location.origin + '/#login';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '36px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            maxWidth: '540px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.4rem' }}>
              Hostel Inventory System
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
              The application encountered a session or rendering issue.
            </p>
            {this.state.error && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '20px',
                textAlign: 'left',
                fontFamily: 'monospace',
                wordBreak: 'break-word'
              }}>
                {String(this.state.error?.message || this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Reset Session & Go to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
