import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterDistributor from './pages/RegisterDistributor';
import ShopHome from './pages/ShopHome';
import ShopOrderHistory from './pages/ShopOrderHistory';
import DistributorDashboard from './pages/DistributorDashboard';
import PendingOrders from './pages/PendingOrders';
import DistributorOrderHistory from './pages/DistributorOrderHistory';
import MyShops from './pages/MyShops';
import StockManagement from './pages/StockManagement';
import AdminDashboard from './pages/AdminDashboard';
import RevenueGraph from './pages/RevenueGraph'; // <-- ADDED THIS IMPORT
import { useAuth, AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {children}
      </div>
    </>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login"                element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register"             element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/register-distributor" element={user ? <Navigate to="/" replace /> : <RegisterDistributor />} />

      {/* ── Redirect Root ── */}
      <Route path="/" element={
        !user ? <Navigate to="/login" replace /> :
        user.role === 'admin' ? <Navigate to="/admin" replace /> :
        user.role === 'distributor' ? <Navigate to="/distributor" replace /> :
        <Navigate to="/shop" replace />
      } />

      {/* ── Shop Owner Routes ── */}
      <Route path="/shop"        element={<ProtectedRoute allowedRoles={['shop_owner']}><ShopHome /></ProtectedRoute>} />
      <Route path="/shop/orders" element={<ProtectedRoute allowedRoles={['shop_owner']}><ShopOrderHistory /></ProtectedRoute>} />

      {/* ── Distributor Routes ── */}
      <Route path="/distributor"         element={<ProtectedRoute allowedRoles={['distributor']}><DistributorDashboard /></ProtectedRoute>} />
      <Route path="/distributor/pending" element={<ProtectedRoute allowedRoles={['distributor']}><PendingOrders /></ProtectedRoute>} />
      <Route path="/distributor/history" element={<ProtectedRoute allowedRoles={['distributor']}><DistributorOrderHistory /></ProtectedRoute>} />
      <Route path="/distributor/shops"   element={<ProtectedRoute allowedRoles={['distributor']}><MyShops /></ProtectedRoute>} />
      <Route path="/distributor/stock"   element={<ProtectedRoute allowedRoles={['distributor']}><StockManagement /></ProtectedRoute>} />
      
      {/* ── ADDED REVENUE GRAPH ROUTE ── */}
      <Route path="/distributor/revenue" element={<ProtectedRoute allowedRoles={['distributor']}><RevenueGraph /></ProtectedRoute>} />

      {/* ── Admin Routes ── */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppRoutes />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;