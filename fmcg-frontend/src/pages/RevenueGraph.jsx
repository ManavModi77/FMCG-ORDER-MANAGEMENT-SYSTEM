import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getOrdersByDistributor, getShopsByDistributor } from '../api/Data';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueGraph = () => {
    const { user } = useAuth();
    
    // States for raw data
    const [allOrders, setAllOrders] = useState([]);
    const [shops, setShops] = useState([]);
    
    // State for filtering and UI
    const [selectedShop, setSelectedShop] = useState('ALL');
    const [loading, setLoading] = useState(true);

    // Fetch both orders and shops at the same time
    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            getOrdersByDistributor(user.id, 'CONFIRMED'),
            getShopsByDistributor(user.id)
        ]).then(([ordersData, shopsData]) => {
            setAllOrders(ordersData);
            setShops(shopsData);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch revenue data", err);
            setLoading(false);
        });
    }, [user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // useMemo recalculates the chart data ONLY when allOrders or selectedShop changes.
    // This prevents us from having to re-fetch from the database every time we use the filter!
    const chartData = useMemo(() => {
        // 1. Filter orders based on the dropdown selection
        const filteredOrders = selectedShop === 'ALL' 
            ? allOrders 
            : allOrders.filter(order => String(order.shopId) === String(selectedShop));

        // 2. Group the filtered orders by Date
        const groupedData = filteredOrders.reduce((acc, order) => {
            const dateObj = new Date(order.date);
            const dateKey = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            
            acc[dateKey] = (acc[dateKey] || 0) + order.total;
            return acc;
        }, {});

        // 3. Convert to array for Recharts
        return Object.keys(groupedData).map(date => ({
            date,
            Revenue: groupedData[date]
        }));
    }, [allOrders, selectedShop]);

    // Calculate total revenue for the currently selected view to display as a summary
    const totalFilteredRevenue = chartData.reduce((sum, data) => sum + data.Revenue, 0);

    if (loading) {
        return <div className="flex-center" style={{ minHeight: '60vh' }}>Loading graph data...</div>;
    }

    return (
        <div className="animate-fade-in">
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/distributor" className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 style={{ margin: 0 }}>Revenue Overview</h2>
                </div>

                {/* --- NEW: Shop Filter Dropdown --- */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--surface))', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                    <Filter size={18} color="hsl(var(--text-muted))" />
                    <select 
                        className="input-field" 
                        style={{ border: 'none', background: 'transparent', padding: '0', margin: 0, outline: 'none', fontWeight: 600, color: 'hsl(var(--text-main))', cursor: 'pointer', minWidth: '150px' }}
                        value={selectedShop}
                        onChange={(e) => setSelectedShop(e.target.value)}
                    >
                        <option value="ALL">All Shops</option>
                        {shops.map(shop => (
                            <option key={shop.id} value={shop.id}>
                                {shop.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ color: 'hsl(var(--text-muted))', margin: 0, fontSize: '0.9rem' }}>
                        {selectedShop === 'ALL' ? 'Total Platform Revenue' : `Revenue for Selected Shop`}
                    </p>
                    <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', color: 'hsl(var(--primary))' }}>
                        ₹{totalFilteredRevenue.toLocaleString('en-IN')}
                    </h3>
                </div>

                {chartData.length === 0 ? (
                    <div className="flex-center" style={{ height: '250px', color: 'hsl(var(--text-muted))' }}>
                        No revenue data available for this selection.
                    </div>
                ) : (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--text-muted))', fontSize: 12 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--text-muted))', fontSize: 12 }}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                                />
                                <Bar 
                                    dataKey="Revenue" 
                                    fill="hsl(var(--primary))" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={50}
                                    animationDuration={500} // Smooth animation when switching shops
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueGraph;