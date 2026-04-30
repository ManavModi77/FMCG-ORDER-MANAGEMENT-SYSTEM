import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LogOut, Store, Package, Boxes, CheckCircle, XCircle, AlertTriangle, X, Users, TrendingUp } from 'lucide-react';

const TOAST_STYLES = {
    success: { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', icon: <CheckCircle size={18} color="#16a34a" /> },
    error:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', icon: <XCircle size={18} color="#dc2626" /> },
    warning: { background: '#fffbeb', border: '1px solid #fcd34d', color: '#854d0e', icon: <AlertTriangle size={18} color="#d97706" /> },
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const { toasts, removeToast} = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Calculate total items in cart (sum of quantities)
    //const cartItemCount = cart.reduce((total, item) => total + item.count, 0);

    return (
        <>
            <nav className="navbar glass">
                <div className="container nav-container">
                    {/* Brand Logo */}
                    <Link to="/" className="nav-brand">
                        <Package size={24} style={{ marginRight: '0.5rem' }} />
                        FMCG Connect
                    </Link>

                    {/* Navigation Links based on User Role */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        
                        {/* ── Admin Links ── */}
                        {user?.role === 'admin' && (
                            <>
                                <Link to="/admin?tab=products" className="nav-link" style={{ color: location.search.includes('tab=products') || !location.search ? 'hsl(var(--primary))' : '' }}>
                                    <Package size={18} /> Products
                                </Link>
                                <Link to="/admin?tab=network" className="nav-link" style={{ color: location.search.includes('tab=network') ? 'hsl(var(--primary))' : '' }}>
                                    <Users size={18} /> Network
                                </Link>
                                <Link to="/admin?tab=revenue" className="nav-link" style={{ color: location.search.includes('tab=revenue') ? 'hsl(var(--primary))' : '' }}>
                                    <TrendingUp size={18} /> Revenue
                                </Link>
                            </>
                        )}

                        {/* ── Distributor Links ── */}
                        {user?.role === 'distributor' && (
                            <>
                                <Link to="/distributor" className="nav-link"><Store size={18} /> Dashboard</Link>
                                <Link to="/distributor/pending" className="nav-link"><CheckCircle size={18} /> Pending</Link>
                                <Link to="/distributor/stock" className="nav-link"><Boxes size={18} /> Stock</Link>
                                <Link to="/distributor/history" className="nav-link"><Package size={18} /> History</Link>
                                <Link to="/distributor/shops" className="nav-link"><Users size={18} /> Shops</Link>
                            </>
                        )}

                        {/* ── Shop Owner Links ── */}
                        {user?.role === 'shop_owner' && (
                            <>
                                <Link to="/" className="nav-link"><Store size={18} /> Shop</Link>
                                <Link to="/shop/orders" className="nav-link"><Package size={18} /> Orders</Link>
                            </>
                        )}

                        {/* ── User Profile & Logout ── */}
                        {user && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid #ddd', paddingLeft: '1.5rem', marginLeft: '0.5rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>{user.role.replace('_', ' ')}</div>
                                </div>
                                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Logout">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Global Toast Notifications rendering over everything */}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: '20px', right: '20px', 
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
