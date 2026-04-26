import React, { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../api/Data';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import { useAuth } from '../context/AuthContext';
import { Search, X } from 'lucide-react';

const CATEGORIES = ['All', 'Biscuits', 'Chocolates', 'Wafers'];

const ShopHome = () => {
    const { user } = useAuth();
    const [products, setProducts]         = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchInput, setSearchInput]   = useState('');
    const [searchTerm, setSearchTerm]     = useState('');
    const [loading, setLoading]           = useState(true);

    // Debounce search input 400ms
    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(searchInput), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // ✅ Pass user.distributorId so the catalog shows THAT distributor's stock levels
    const fetchProducts = useCallback(() => {
        setLoading(true);
        const categoryFilter = activeCategory === 'All' ? null : activeCategory;
        getProducts(categoryFilter, searchTerm, user.distributorId).then(data => {
            setProducts(data);
            setLoading(false);
        });
    }, [activeCategory, searchTerm, user.distributorId]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleClearSearch = () => { setSearchInput(''); setSearchTerm(''); };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h2>Product Catalog</h2>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>Welcome back, {user?.name}</p>
                </div>
                <Cart />
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '480px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                <input
                    type="text" className="input-field"
                    placeholder="Search products by name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', width: '100%' }}
                />
                {searchInput && (
                    <button onClick={handleClearSearch} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center' }}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ borderRadius: '999px', whiteSpace: 'nowrap' }}>
                        {cat}
                    </button>
                ))}
            </div>

            {searchTerm && !loading && (
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
                    {products.length === 0
                        ? `No products found for "${searchTerm}"`
                        : `${products.length} result${products.length > 1 ? 's' : ''} for "${searchTerm}"`}
                </p>
            )}

            {loading ? (
                <div className="flex-center" style={{ minHeight: '300px' }}>
                    <div style={{ color: 'hsl(var(--text-muted))' }}>Loading products...</div>
                </div>
            ) : products.length === 0 && !searchTerm ? (
                <div className="flex-center" style={{ minHeight: '300px', flexDirection: 'column', color: 'hsl(var(--text-muted))' }}>
                    <p>No products available in this category.</p>
                </div>
            ) : (
                <div className="grid-cards">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShopHome;
