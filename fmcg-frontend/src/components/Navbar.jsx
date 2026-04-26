import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LogOut, Store, Package, ShoppingCart, Boxes, CheckCircle, XCircle, AlertTriangle, X, Shield, Users } from 'lucide-react';

const TOAST_STYLES = {
    success: { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', icon: <CheckCircle size={18} color="#16a34a" /> },
    error:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', icon: <XCircle size={18} color="#dc2626" /> },
    warning: { background: '#fffbeb', border: '1px solid #fcd34d', color: '#854d0e', icon: <AlertTriangle size={18} color="#d97706" /> },
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const { toasts, removeToast } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <nav className="navbar glass">
                <div className="container nav-container">
                    <Link to="/" className="nav-brand">
                        <Package className="h-6 w-6" />
                        FMCG Connect
                    </Link>

                    {user && (
                        <div className="nav-links">
                            {/* ── Shop Owner links ── */}
                            {user.role === 'shop_owner' && (
                                <>
                                    <Link to="/shop" className="nav-link flex-center" style={{ gap: '0.25rem' }}>
                                        <Store size={18} /> Catalog
                                    </Link>
                                    <Link to="/shop/orders" className="nav-link flex-center" style={{ gap: '0.25rem' }}>
                                        <ShoppingCart size={18} /> My Orders
                                    </Link>
                                </>
                            )}

                            {/* ── Distributor links ── */}
                            {user.role === 'distributor' && (
                                <>
                                    <Link to="/distributor"         className="nav-link">Dashboard</Link>
                                    <Link to="/distributor/pending" className="nav-link">Pending Orders</Link>
                                    <Link to="/distributor/history" className="nav-link">History</Link>
                                    <Link to="/distributor/shops"   className="nav-link">My Shops</Link>
                                    <Link to="/distributor/stock"   className="nav-link flex-center" style={{ gap: '0.25rem' }}>
                                        <Boxes size={18} /> Stock
                                    </Link>
                                </>
                            )}

                            {/* ── Admin links ── */}
                            {user.role === 'admin' && (
                                <>
                                    <Link to="/admin" className="nav-link flex-center" style={{ gap: '0.25rem' }}>
                                        <Package size={18} /> Products
                                    </Link>
                                    <Link to="/admin" className="nav-link flex-center" style={{ gap: '0.25rem' }}>
                                        <Users size={18} /> Network
                                    </Link>
                                </>
                            )}

                            <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--text-muted)' }} className="flex-center">
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {user.role === 'admin' && <Shield size={14} color="hsl(var(--primary))" />}
                                    {user.name} ({user.role === 'distributor' ? 'Distributor' : user.role === 'admin' ? 'Admin' : 'Shop'})
                                </span>
                                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Toast container */}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
                    zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem'
                }}>
                    {toasts.map(t => {
                        const s = TOAST_STYLES[t.type] || TOAST_STYLES.success;
                        return (
                            <div key={t.id} className="animate-fade-in" style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-lg)', minWidth: '280px', maxWidth: '400px',
                                background: s.background, border: s.border, color: s.color,
                            }}>
                                {s.icon}
                                <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem' }}>{t.message}</span>
                                <button onClick={() => removeToast(t.id)} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: s.color, opacity: 0.6, display: 'flex', alignItems: 'center'
                                }}>
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default Navbar;
