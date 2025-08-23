import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CurrencyProvider } from './pages/CurrencyContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import ShopAllPage from './pages/ShopAllPage';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import Checkoutprocess from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import Signup from './pages/Signup';
import UserOrders from './pages/UserOrders';
import ProfilePage from './pages/ProfilePage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MorePage from './pages/Moresection';
import HelpPage from './pages/Helpsection';
import ThankYou from './pages/ThankYou';
import DeliveryFeeThankYou from './pages/DeliveryFeeThankYou';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SearchResults from './pages/SearchResults';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="/search" element={<SearchResults />} />
            <Route path="/home" element={<Home />} />
            <Route path="/shop" element={<ShopAllPage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/bundle/:id" element={<ProductDetails />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} /> {/* Removed ProtectedRoute for guest access */}
            <Route path="/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
            <Route path="/checkout" element={<Checkoutprocess />} /> {/* Removed ProtectedRoute for guest access */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/thank-you" element={<ThankYou />} /> {/* Removed ProtectedRoute for guest access */}
            <Route path="/delivery-fee-thank-you" element={<DeliveryFeeThankYou />} /> {/* Removed ProtectedRoute for guest access */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AdminAuthProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;