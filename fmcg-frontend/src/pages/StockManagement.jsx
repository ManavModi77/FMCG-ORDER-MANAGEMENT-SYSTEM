import React, { useState, useEffect, useCallback } from 'react';
import { getDistributorInventory, updateProductStock } from '../api/Data';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PackageOpen, Plus, CheckCircle, AlertTriangle } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 10;

const CATEGORY_RULES = {
    Biscuits:   { label: '1 Box (60 pcs)',  addAmount: 60 },
    Chocolates: { label: '1 Packet (1 pc)', addAmount: 1  },
    Wafers:     { label: '1 Row (10 pcs)',  addAmount: 10 },
};

const StockManagement = () => {
    const { user } = useAuth();
    const { toast } = useCart();
    const [products, setProducts] = useState([]);
    const [adding, setAdding]     = useState({});
    const [saving, setSaving]     = useState({});
    const [saved,  setSaved]      = useState({});
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    // ✅ Now fetches THIS distributor's personal inventory
    const fetchProducts = useCallback(() => {
        setLoading(true);
        getDistributorInventory(user.id)
            .then(data => { setProducts(data); setLoading(false); })
            .catch(() => { setError('Failed to load inventory.'); setLoading(false); });
    }, [user.id]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const getRule    = (cat) => CATEGORY_RULES[cat] || { label: '1 Unit', addAmount: 1 };
    const getAddQty  = (product) => adding[product.id] ?? 1;

    const handleQtyChange = (productId, delta) => {
        setAdding(prev => ({ ...prev, [productId]: Math.max(1, (prev[productId] ?? 1) + delta) }));
        setSaved(prev => ({ ...prev, [productId]: false }));
    };

    const handleAddStock = async (product) => {
        const rule     = getRule(product.category);
        const qty      = getAddQty(product);
        const toAdd    = qty * rule.addAmount;
        const newStock = product.stock + toAdd;

        setSaving(prev => ({ ...prev, [product.id]: true }));
        try {
            // ✅ Pass user.id (distributorId) so only THIS distributor's row is updated
            await updateProductStock(product.id, newStock, user.id);
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
            toast.success(`Stock updated for ${product.name}!`);
            setSaved(prev => ({ ...prev, [product.id]: true }));
            setAdding(prev => ({ ...prev, [product.id]: 1 }));
            setTimeout(() => setSaved(prev => ({ ...prev, [product.id]: false })), 2000);
        } catch (err) {
            toast.error(err.message || 'Failed to update stock.');
        } finally {
            setSaving(prev => ({ ...prev, [product.id]: false }));
        }
    };

    const getStockBadge = (stock) => {
        if (stock === 0)                  return { label: 'Out of Stock', bg: '#fee2e2', color: '#991b1b' };
        if (stock <= LOW_STOCK_THRESHOLD) return { label: 'Low Stock',    bg: '#fef08a', color: '#854d0e' };
        return                                   { label: 'In Stock',     bg: '#bbf7d0', color: '#166534' };
    };

    const lowStockCount = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;

    if (loading) return <div className="flex-center" style={{ minHeight: '300px' }}>Loading inventory...</div>;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2>Stock Management</h2>
                <p style={{ color: 'hsl(var(--text-muted))' }}>
                    Your personal inventory — changes here only affect your shops
                </p>
            </div>

            {/* Unit Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {Object.entries(CATEGORY_RULES).map(([cat, rule]) => (
                    <div key={cat} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                        background: 'white', boxShadow: 'var(--shadow-sm)', fontSize: '0.85rem', fontWeight: 500
                    }}>
                        <span className="badge badge-primary">{cat}</span>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>unit =</span>
                        <strong>{rule.label}</strong>
                    </div>
                ))}
            </div>

            {/* Low Stock Warning */}
            {lowStockCount > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
                    background: '#fef08a', color: '#854d0e', marginBottom: '2rem', fontWeight: 500
                }}>
                    <AlertTriangle size={20} />
                    <span>
                        <strong>{lowStockCount} product{lowStockCount > 1 ? 's' : ''}</strong> running low (≤ {LOW_STOCK_THRESHOLD} units)
                    </span>
                </div>
            )}

            {error && (
                <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {/* Product Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'hsl(var(--bg-color))', borderBottom: '2px solid #eee' }}>
                            {['Product', 'Category', 'Your Stock', 'Status', 'Add Stock', 'Action'].map(h => (
                                <th key={h} style={thStyle}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => {
                            const rule     = getRule(product.category);
                            const qty      = getAddQty(product);
                            const badge    = getStockBadge(product.stock);
                            const isSaving = saving[product.id];
                            const isSaved  = saved[product.id];

                            return (
                                <tr key={product.id} style={{ borderBottom: index < products.length - 1 ? '1px solid #eee' : 'none', background: 'white' }}>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <img src={product.image || '/api/placeholder/40/40'} alt={product.name}
                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: '#f3f4f6' }} />
                                            <span style={{ fontWeight: 600 }}>{product.name}</span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}><span className="badge badge-primary">{product.category}</span></td>
                                    <td style={tdStyle}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                                            {product.stock}
                                            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'hsl(var(--text-muted))', marginLeft: '0.25rem' }}>units</span>
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: badge.bg, color: badge.color }}>
                                            {badge.label}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <button onClick={() => handleQtyChange(product.id, -1)} disabled={qty <= 1}
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid hsl(var(--primary) / 0.3)', background: 'white', cursor: qty <= 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty <= 1 ? 0.4 : 1 }}>−</button>
                                            <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '24px', textAlign: 'center' }}>{qty}</span>
                                            <button onClick={() => handleQtyChange(product.id, 1)}
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid hsl(var(--primary) / 0.3)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{rule.label.split('(')[0].trim()}</span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        {isSaved ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>
                                                <CheckCircle size={18} /> Added!
                                            </div>
                                        ) : (
                                            <button onClick={() => handleAddStock(product)} disabled={isSaving}
                                                className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                                {isSaving ? '...' : <><Plus size={14} /> Add</>}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <div className="flex-center" style={{ flexDirection: 'column', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
                        <PackageOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No products in inventory.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const thStyle = { padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' };
const tdStyle = { padding: '1rem 1.25rem', verticalAlign: 'middle' };

export default StockManagement;
