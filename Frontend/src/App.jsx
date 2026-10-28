import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CurrencyProvider } from './pages/CurrencyContext';
import { Toaster } from './components/ui/sonner';

import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import CartErrorBoundary from './components/CartErrorBoundary';
import SmoothScroll from './components/SmoothScroll';
import ScrollProgress from './components/ScrollProgress';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';

// Route-level lazy loading for performance and speed
const ShopAllPage = lazy(() => import('./pages/ShopAllPage'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Checkoutprocess = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Signup = lazy(() => import('./pages/Signup'));
const UserOrders = lazy(() => import('./pages/UserOrders'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MorePage = lazy(() => import('./pages/Moresection'));
const HelpPage = lazy(() => import('./pages/Helpsection'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const DeliveryFeeThankYou = lazy(() => import('./pages/DeliveryFeeThankYou'));
const GiftCardPage = lazy(() => import('./pages/GiftCardPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const SearchResults = lazy(() => import('./pages/SearchResults'));

const PageSkeleton = () => (
  <div className="min-h-screen bg-white font-Jost">
    {/* Top Navbar Skeleton */}
    <div className="h-20 border-b border-gray-100 px-6 sm:px-12 flex items-center justify-between animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-28" />
      <div className="hidden md:flex gap-8">
        <div className="h-4 bg-gray-100 rounded w-16" />
        <div className="h-4 bg-gray-100 rounded w-20" />
        <div className="h-4 bg-gray-100 rounded w-16" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100" />
        <div className="w-8 h-8 rounded-full bg-gray-100" />
      </div>
    </div>

    {/* Hero / Page Content Skeleton */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded w-32" />
        <div className="h-9 bg-gray-200 rounded-xl w-64" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <AdminAuthProvider>
            <SmoothScroll>
              <ScrollProgress />
              <ScrollToTop />
              <CartDrawer />
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/home" element={<LandingPage />} />
                  <Route path="/shop" element={<ShopAllPage />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/bundle/:id" element={<ProductDetails />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/more" element={<MorePage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/cart" element={<CartErrorBoundary><Cart /></CartErrorBoundary>} />
                  <Route path="/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                  <Route path="/checkout" element={<Checkoutprocess />} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/thank-you" element={<ThankYou />} />
                  <Route path="/delivery-fee-thank-you" element={<DeliveryFeeThankYou />} />
                  <Route path="/gift-cards" element={<GiftCardPage />} />

                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                </Routes>
              </Suspense>
            </SmoothScroll>
            {/* Themed Shadcn Sonner notification matching the brand color palette */}
            <Toaster />
          </AdminAuthProvider>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
