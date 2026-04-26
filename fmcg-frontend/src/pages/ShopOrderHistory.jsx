import React, { useState, useEffect, useCallback } from 'react';
import { getOrdersByShop, cancelOrder } from '../api/Data';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PackageOpen, XCircle } from 'lucide-react';

const ShopOrderHistory = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);   // tracks which order is being cancelled
    const { toast } = useCart();
    const [confirmDialog, setConfirmDialog] = useState(null); // holds orderId awaiting confirmation

    // useCallback gives fetchOrders a stable reference — satisfies the ESLint dependency rule
    const fetchOrders = useCallback(() => {
        getOrdersByShop(user.id).then(data => {
            setOrders(data);
            setLoading(false);
        });
    }, [user.id]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleCancelClick = (orderId) => {
        // Show inline confirmation dialog instead of browser alert
        setConfirmDialog(orderId);
    };

    const handleCancelConfirm = async () => {
        const orderId = confirmDialog;
        setConfirmDialog(null);
        setCancellingId(orderId);
        try {
            await cancelOrder(orderId);
            // Update the order status locally — no need to re-fetch from server
            setOrders(prev =>
                prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o)
            );
            toast.success('Order cancelled. Stock has been restored.');
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to cancel order.';
            toast.error(message);
        } finally {
            setCancellingId(null);
        }
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Returns the right badge style for each status
    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pending')   return 'badge-pending';
        if (s === 'confirmed') return 'badge-confirmed';
        if (s === 'cancelled') return 'badge-cancelled';
        return '';
    };

    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>My Order History</h2>

            {/* ── Inline Confirmation Dialog ── */}
            {confirmDialog && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <XCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Cancel this order?</h3>
                        <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            This action cannot be undone. The order will be marked as cancelled.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setConfirmDialog(null)}
                            >
                                Keep Order
                            </button>
                            <button
                                className="btn"
                                style={{ background: '#ef4444', color: 'white' }}
                                onClick={handleCancelConfirm}
                            >
                                Yes, Cancel It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex-center" style={{ minHeight: '300px' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="card flex-center" style={{ flexDirection: 'column', height: '300px', color: 'hsl(var(--text-muted))' }}>
                    <PackageOpen size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>You haven't placed any orders yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {orders.map(order => {
                        const isCancelled = order.status?.toUpperCase() === 'CANCELLED';
                        const isConfirmed = order.status?.toUpperCase() === 'CONFIRMED';
                        const isCancelling = cancellingId === order.id;

                        return (
                            <div
                                key={order.id}
                                className="card"
                                style={{ opacity: isCancelled ? 0.65 : 1, transition: 'opacity 0.3s' }}
                            >
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'flex-start', borderBottom: '1px solid #eee',
                                    paddingBottom: '1rem', marginBottom: '1rem'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                            Order #{order.id}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                                            {formatDate(order.date)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        {/* Status Badge */}
                                        <span className={`badge ${getStatusBadge(order.status)}`}>
                                            {order.status?.toUpperCase()}
                                        </span>

                                        {/* Cancel button — only shown for PENDING orders */}
                                        {!isCancelled && !isConfirmed && (
                                            <button
                                                onClick={() => handleCancelClick(order.id)}
                                                disabled={isCancelling}
                                                className="btn"
                                                style={{
                                                    padding: '0.4rem 0.85rem',
                                                    fontSize: '0.8rem',
                                                    background: 'none',
                                                    border: '1.5px solid #ef4444',
                                                    color: '#ef4444',
                                                    borderRadius: 'var(--radius-md)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                            >
                                                <XCircle size={14} />
                                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Items:</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        {order.items.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>
                                                    {item.quantityType === 'custom' ? item.label : `${item.count} pcs`} x {item.product.name}
                                                </span>
                                                <span>₹{item.subtotal}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    borderTop: '1px solid #eee', paddingTop: '1rem', fontWeight: 700
                                }}>
                                    <span>Total Amount:</span>
                                    <span style={{
                                        color: isCancelled ? 'hsl(var(--text-muted))' : 'hsl(var(--primary))',
                                        textDecoration: isCancelled ? 'line-through' : 'none'
                                    }}>
                                        ₹{order.total}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ShopOrderHistory;
