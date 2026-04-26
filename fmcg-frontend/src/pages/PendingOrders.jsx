import React, { useState, useEffect, useCallback } from 'react';
import { getOrdersByDistributor, confirmOrder } from '../api/Data';
import { useAuth } from '../context/AuthContext';
import { Check } from 'lucide-react';

const PendingOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState(null);

    const fetchPendingOrders = useCallback(() => {
        setLoading(true);
        getOrdersByDistributor(user.id, 'pending').then(data => {
            setOrders(data);
            setLoading(false);
        });
    }, [user.id]);

    useEffect(() => {
        fetchPendingOrders();
    }, [fetchPendingOrders]);

    const handleConfirm = async (orderId) => {
        setConfirmingId(orderId);
        try {
            await confirmOrder(orderId);
            fetchPendingOrders(); // Refresh list
        } catch (error) {
            console.error("Failed to confirm", error);
        } finally {
            setConfirmingId(null);
        }
    };



    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2>Pending Orders</h2>
                <p style={{ color: 'hsl(var(--text-muted))' }}>Approve orders and generate bills</p>
            </div>

            {loading ? (
                <div className="flex-center" style={{ minHeight: '300px' }}>Loading pending orders...</div>
            ) : orders.length === 0 ? (
                <div className="card flex-center" style={{ flexDirection: 'column', height: '300px', color: 'hsl(var(--text-muted))' }}>
                    <Check size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>You have no pending orders. Great job!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {orders.map(order => (
                        <div key={order.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Order #{order.id}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                                        Placed by: <span style={{ fontWeight: 500, color: 'hsl(var(--primary))' }}>{order.shopName}</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                                        {new Date(order.date).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--primary))', textAlign: 'right' }}>
                                        ₹{order.total}
                                    </div>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleConfirm(order.id)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                                            disabled={confirmingId === order.id}
                                        >
                                            {confirmingId === order.id ? 'Confirming...' : <><Check size={16} /> Confirm</>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Items Requested:</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    {order.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{item.quantityType === 'custom' ? item.label : `${item.count} pcs`} x {item.product.name}</span>
                                            <span>₹{item.subtotal}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingOrders;
