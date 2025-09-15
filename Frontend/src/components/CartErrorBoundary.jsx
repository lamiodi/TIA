import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Navbar2 from './Navbar2';
import Footer from './Footer';

class CartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('Cart Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Reload the page to restart the cart
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            '--color-Primarycolor': '#1E1E1E',
            '--color-Secondarycolor': '#ffffff',
            '--color-Accent': '#6E6E6E',
            '--font-Manrope': '"Manrope", "sans-serif"',
            '--font-Jost': '"Jost", "sans-serif"',
          }}
        >
          <Navbar2 />
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full mx-4">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="h-16 w-16 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 font-Manrope">
                  Cart Loading Error
                </h2>
                <p className="text-gray-600 mb-6 font-Jost">
                  We encountered an issue while loading your cart. This might be due to a temporary problem.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-Primarycolor text-white py-3 px-6 rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 font-Jost"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Loading Cart
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors font-Jost"
                  >
                    Go to Homepage
                  </button>
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Error Details (Development)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                      <div className="mb-2">
                        <strong>Error:</strong> {this.state.error.toString()}
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      );
    }

    return this.props.children;
  }
}

export default CartErrorBoundary;