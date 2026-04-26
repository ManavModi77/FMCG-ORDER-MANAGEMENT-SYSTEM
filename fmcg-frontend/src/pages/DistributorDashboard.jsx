import React, { useState, useEffect } from 'react';
import { getOrdersByDistributor, getShopsByDistributor, getDistributorInventory } from '../api/Data';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ClipboardList, Store, Boxes, AlertTriangle, TrendingUp } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 10;

const DistributorDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pendingCount: 0, confirmedCount: 0,
        totalShops: 0,   revenue: 0,
        totalProducts: 0, lowStockCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getOrdersByDistributor(user.id),
            getShopsByDistributor(user.id),
            getDistributorInventory(user.id)
        ]).then(([orders, shops, inventory]) => {
            const pending   = orders.filter(o => o.status === 'PENDING');
            const confirmed = orders.filter(o => o.status === 'CONFIRMED');
            const rev       = confirmed.reduce((sum, o) => sum + o.total, 0);
            const lowStock  = inventory.filter(p => p.stock <= LOW_STOCK_THRESHOLD);

            setStats({
                pendingCount: pending.length,
                confirmedCount: confirmed.length,
                totalShops: shops.length,
                revenue: rev,
                totalProducts: inventory.length,
                lowStockCount: lowStock.length
            });
            setLoading(false);
        });
    }, [user.id]);

    if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}>Loading Dashboard...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h2>Distributor Dashboard</h2>
                <p style={{ color: 'hsl(var(--text-muted))' }}>Welcome back, {user.name}!</p>
            </div>

            <div className="grid-cards">
                {/* 1. Clickable Revenue Card */}
                <div className="card card-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'hsl(var(--text-muted))' }}>Total Revenue</h3>
                        <TrendingUp size={24} color="hsl(var(--primary))" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                        ₹{stats.revenue.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', marginTop: '0.4rem' }}>from {stats.confirmedCount} confirmed orders</div>
                    <Link to="/distributor/revenue" style={{ display: 'block', marginTop: '1rem', color: 'hsl(var(--primary))', textDecoration: 'none', fontWeight: 600 }}>
                        View Revenue Graph &rarr;
                    </Link>
                </div>

                {/* 2. Pending Orders Card */}
                <div className="card card-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'hsl(var(--text-muted))' }}>Pending Orders</h3>
                        <ClipboardList size={24} color="hsl(var(--primary))" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.pendingCount}</div>
                    <Link to="/distributor/pending" style={{ display: 'block', marginTop: '1rem', color: 'hsl(var(--primary))', textDecoration: 'none', fontWeight: 600 }}>
                        Review Orders &rarr;
                    </Link>
                </div>

                {/* 3. My Network Card */}
                <div className="card card-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'hsl(var(--text-muted))' }}>My Network</h3>
                        <Store size={24} color="hsl(var(--primary))" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.totalShops}</div>
                    <Link to="/distributor/shops" style={{ display: 'block', marginTop: '1rem', color: 'hsl(var(--primary))', textDecoration: 'none', fontWeight: 600 }}>
                        View Shops &rarr;
                    </Link>
                </div>

                {/* 4. Inventory Card */}
                <div className="card card-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'hsl(var(--text-muted))' }}>My Stock</h3>
                        <Boxes size={24} color="hsl(var(--primary))" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.totalProducts}</div>
                    
                    {stats.lowStockCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: '#fef08a', color: '#854d0e', fontSize: '0.8rem', fontWeight: 600 }}>
                            <AlertTriangle size={14} />
                            {stats.lowStockCount} product{stats.lowStockCount > 1 ? 's' : ''} low on stock
                        </div>
                    )}

                    <Link to="/distributor/stock" style={{ display: 'block', marginTop: '1rem', color: 'hsl(var(--primary))', textDecoration: 'none', fontWeight: 600 }}>
                        Manage Stock &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DistributorDashboard;