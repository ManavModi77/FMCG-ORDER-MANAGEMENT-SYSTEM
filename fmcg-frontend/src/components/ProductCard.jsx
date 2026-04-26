import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

const ProductCard = ({ product }) => {
    const { addToCart, toast } = useCart();
    const [customQty, setCustomQty] = useState(3); 
    const [selectedType, setSelectedType] = useState('');

    const getPurchaseOptions = () => {
        // 1. Logic for Biscuits
        if (product.category === 'Biscuits') {
            return [
                { type: 'pack_12', label: '1 Pack (12 pcs)', count: 12, priceMultiplier: 12 },
                { type: 'box_60', label: '1 Box (60 pcs)', count: 60, priceMultiplier: 60 }
            ];
        }
        // 2. Logic for Chocolates
        if (product.category === 'Chocolates') {
            return [
                { type: 'min_3', label: '3 Packets (Min)', count: 3, priceMultiplier: 3 },
                { type: 'custom', label: `Custom (Min 3)`, count: customQty, priceMultiplier: customQty }
            ];
        }
        // 3. Logic for everything else (Wafers, etc.)
        return [
            { type: 'row_10', label: '1 Row (10 units)', count: 10, priceMultiplier: 10 }
        ];
    };

    const options = getPurchaseOptions();

    // Ensure a default selection is made
    useEffect(() => {
        if (!selectedType && options.length > 0) {
            setSelectedType(options[0].type);
        }
    }, [options, selectedType]);

    const handleAddToCart = () => {
        const selectedOption = options.find(opt => opt.type === selectedType) || options[0];
        
        // Use custom quantity for chocolate if 'custom' is selected
        let finalOption = { ...selectedOption };
        if (product.category === 'Chocolates' && selectedType === 'custom') {
            const qty = Math.max(3, customQty);
            finalOption.count = qty;
            finalOption.priceMultiplier = qty;
            finalOption.label = `${qty} Packets (Custom)`;
        }

        const subtotal = product.price * finalOption.priceMultiplier;
        addToCart(product, finalOption, subtotal);
        toast.success(`${product.name} added to cart!`);
    };

    return (
        <div className="card card-hover animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', paddingTop: '75%', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                <img 
                    src={product.image || "/api/placeholder/400/300"} 
                    alt={product.name}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'cover', padding: '1rem' }}
                />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{product.name}</h3>
                    <span className="badge badge-primary">{product.category}</span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                        ₹{product.price} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>/ unit</span>
                    </div>
                    {/* ✅ NEW: Stock indicator */}
                    <div style={{ marginTop: '0.4rem' }}>
                        {product.stock === 0 ? (
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#fee2e2', color: '#991b1b' }}>
                                Out of Stock
                            </span>
                        ) : product.stock <= 10 ? (
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#fef08a', color: '#854d0e' }}>
                                Only {product.stock} left!
                            </span>
                        ) : (
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#bbf7d0', color: '#166534' }}>
                                In Stock ({product.stock} units)
                            </span>
                        )}
                    </div>
                </div>

                <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label className="input-label">Order Quantity</label>
                    <select
                        className="input-field select-field"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        style={{ padding: '0.5rem' }}
                    >
                        {options.map(opt => (
                            <option key={opt.type} value={opt.type}>{opt.label}</option>
                        ))}
                    </select>

                    {selectedType === 'custom' && product.category === 'Chocolates' && (
                        <div style={{ marginTop: '0.5rem' }}>
                             <label className="input-label" style={{ fontSize: '0.75rem' }}>Enter Quantity (Min 3)</label>
                             <input
                                type="number"
                                min="3"
                                className="input-field"
                                value={customQty}
                                onChange={(e) => setCustomQty(parseInt(e.target.value) || 3)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ Disabled when out of stock */}
            <button
                onClick={handleAddToCart}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'auto', opacity: product.stock === 0 ? 0.5 : 1 }}
                disabled={product.stock === 0}
                title={product.stock === 0 ? 'This product is out of stock' : ''}
            >
                <ShoppingCart size={18} />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    );
};

export default ProductCard;