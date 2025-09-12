import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && !user) {
    localStorage.removeItem('token');
  }
}

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
