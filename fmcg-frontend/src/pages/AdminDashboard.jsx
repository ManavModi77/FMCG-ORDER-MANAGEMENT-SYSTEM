import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDistributors, getShopsByDistributor, getOrdersByDistributor } from '../api/Data';
import { useCart } from '../context/CartContext';
import { Package, Store, Plus, ChevronDown, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORIES = ['Biscuits', 'Chocolates', 'Wafers'];

// ── Add Product Form ────────────────────────────────────────────────
const AddProductPanel = ({ onProductAdded }) => {
    const { toast } = useCart();
    const [form, setForm] = useState({
        name: '', category: 'Biscuits', price: '', image: ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.price) {
            toast.error('Product name and price are required.');
            return;
        }
        setSaving(true);
        try {
            const userStr = localStorage.getItem('currentUser');
            const user = userStr ? JSON.parse(userStr) : null;
            await fetch('http://localhost:8080/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ ...form, price: parseFloat(form.price) })
            });
            toast.success('Product added successfully!');
            setForm({ name: '', category: 'Biscuits', price: '', image: '' });
            if (onProductAdded) onProductAdded();
        } catch (err) {
            toast.error('Failed to add product');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="hsl(var(--primary))" /> Add New Product
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div className="input-group">
                    <label className="input-label">Product Name</label>
                    <input type="text" name="name" className="input-field" value={form.name} onChange={handleChange} required placeholder="e.g., Good Day" />
                </div>
                <div className="input-group">
                    <label className="input-label">Category</label>
                    <select name="category" className="input-field select-field" value={form.category} onChange={handleChange}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="input-group">
                    <label className="input-label">Price (₹)</label>
                    <input type="number" name="price" min="1" className="input-field" value={form.price} onChange={handleChange} required placeholder="e.g., 20" />
                </div>
                <div className="input-group">
                    <label className="input-label">Image URL</label>
                    <input type="text" name="image" className="input-field" value={form.image} onChange={handleChange} placeholder="e.g., https://example.com/image.jpg" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Product'}
                </button>
            </form>
        </div>
    );
};

// ── Catalog Panel ────────────────────────────────────────────────
const CatalogPanel = () => {
    const { toast } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = useCallback(() => {
        setLoading(true);
        const userStr = localStorage.getItem('currentUser');
        const user = userStr ? JSON.parse(userStr) : null;
        fetch('http://localhost:8080/api/products', {
            headers: { 'Authorization': `Bearer ${user?.token}` }
        })
            .then(res => res.json())
            .then(data => { setProducts(data); setLoading(false); })
            .catch(() => { toast.error('Failed to load products'); setLoading(false); });
    }, [toast]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    if (loading) return <div className="flex-center" style={{ minHeight: '200px' }}>Loading catalog...</div>;

    return (
        <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="hsl(var(--primary))" /> Product Catalog
            </h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>Category</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: 'hsl(var(--text-muted))' }}>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>#{p.id}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span className="badge badge-primary">{p.category}</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>₹{p.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && <div className="flex-center" style={{ padding: '2rem', color: 'hsl(var(--text-muted))' }}>No products found.</div>}
            </div>
        </div>
    );
};

// ── Distributor Network Panel ────────────────────────────────────────────────
const DistributorShopsPanel = () => {
    const [distributors, setDistributors] = useState([]);
    const [shopsData, setShopsData] = useState({});
    const [expandedDist, setExpandedDist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDistributors().then(data => {
            setDistributors(data);
            setLoading(false);
        });
    }, []);

    const toggleExpand = async (distId) => {
        if (expandedDist === distId) {
            setExpandedDist(null);
            return;
        }
        setExpandedDist(distId);
        if (!shopsData[distId]) {
            try {
                const shops = await getShopsByDistributor(distId);
                setShopsData(prev => ({ ...prev, [distId]: shops }));
            } catch (err) {
                console.error("Failed to fetch shops", err);
            }
        }
    };

    if (loading) return <div className="flex-center" style={{ minHeight: '200px' }}>Loading network...</div>;

    return (
        <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="hsl(var(--primary))" /> Distributor Network
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {distributors.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem' }}>No distributors registered yet.</div>
                ) : distributors.map(dist => (
                    <div key={dist.id} style={{ border: '1px solid #eee', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <div
                            onClick={() => toggleExpand(dist.id)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: expandedDist === dist.id ? 'hsl(var(--primary) / 0.05)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Store size={20} color="hsl(var(--primary))" />
                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{dist.name}</span>
                                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>({dist.email})</span>
                            </div>
                            {expandedDist === dist.id ? <ChevronDown size={20} color="hsl(var(--text-muted))" /> : <ChevronRight size={20} color="hsl(var(--text-muted))" />}
                        </div>

                        {expandedDist === dist.id && (
                            <div style={{ padding: '1.5rem', background: '#fafafa', borderTop: '1px solid #eee' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Connected Shops</h4>
                                {!shopsData[dist.id] ? (
                                    <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>Loading shops...</div>
                                ) : shopsData[dist.id].length === 0 ? (
                                    <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>No shops connected.</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                        {shopsData[dist.id].map(shop => (
                                            <div key={shop.id} style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ fontWeight: 600 }}>{shop.name}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{shop.email}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Admin Revenue Graph Panel ──────────────────────────────────────────
const AdminRevenueGraphPanel = () => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPlatformRevenue, setTotalPlatformRevenue] = useState(0);

    useEffect(() => {
        const fetchAllRevenues = async () => {
            try {
                const dists = await getDistributors();
                const revenues = await Promise.all(
                    dists.map(async (dist) => {
                        try {
                            const orders = await getOrdersByDistributor(dist.id, 'CONFIRMED');
                            const distTotal = orders.reduce((sum, o) => sum + o.total, 0);
                            return { name: dist.name, Revenue: distTotal };
                        } catch (err) {
                            return { name: dist.name, Revenue: 0 };
                        }
                    })
                );
                const total = revenues.reduce((sum, r) => sum + r.Revenue, 0);
                revenues.sort((b) => b.Revenue - revenues[0].Revenue);
                setChartData(revenues);
                setTotalPlatformRevenue(total);
            } catch (error) {
                console.error("Error generating admin graph", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllRevenues();
    }, []);

    if (loading) return <div className="flex-center" style={{ minHeight: '300px' }}>Loading platform revenue data...</div>;

    return (
        <div className="card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <TrendingUp size={20} color="hsl(var(--primary))" /> Distributor Revenue Comparison
                </h3>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'hsl(var(--text-muted))', margin: 0, fontSize: '0.9rem' }}>Total Platform Revenue</p>
                    <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', color: 'hsl(var(--primary))' }}>
                        ₹{totalPlatformRevenue.toLocaleString('en-IN')}
                    </h3>
                </div>
            </div>
            {chartData.length === 0 || totalPlatformRevenue === 0 ? (
                <div className="flex-center" style={{ height: '300px', color: 'hsl(var(--text-muted))' }}>
                    No revenue data generated yet.
                </div>
            ) : (
                <div style={{ width: '100%', height: 450 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'hsl(var(--text-main))', fontSize: 13, fontWeight: 600 }} 
                                angle={-45}
                                textAnchor="end"
                                dx={-5}
                                dy={5}
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
                                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Total Revenue']}
                            />
                            <Bar 
                                dataKey="Revenue" 
                                fill="hsl(var(--primary))" 
                                radius={[6, 6, 0, 0]} 
                                barSize={60}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

// ── Main Dashboard Component ────────────────────────────────────────────────
const AdminDashboard = () => {
    // Uses URL parameters so browser back/forward buttons work
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'products';

    const tabs = [
        { id: 'products', label: 'Products', icon: <Package size={18} /> },
        { id: 'network', label: 'Distributor Network', icon: <Users size={18} /> },
        { id: 'revenue', label: 'Revenue Graph', icon: <TrendingUp size={18} /> }
    ];

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2>Admin Dashboard</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #eee', marginBottom: '2rem', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSearchParams({ tab: tab.id })}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.95rem',
                            color: activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                            borderBottom: activeTab === tab.id ? '2.5px solid hsl(var(--primary))' : '2.5px solid transparent',
                            marginBottom: '-2px', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
            
            {activeTab === 'products' && (
                <div className="animate-fade-in">
                    <AddProductPanel />
                    <CatalogPanel />
                </div>
            )}
            {activeTab === 'network' && (
                <div className="animate-fade-in">
                    <DistributorShopsPanel />
                </div>
            )}
            {activeTab === 'revenue' && (
                <div className="animate-fade-in">
                    <AdminRevenueGraphPanel />
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
