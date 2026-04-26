import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import * as api from '../api/Data';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// The new Stripe import!
import StripeCheckout from 'react-stripe-checkout';

const Cart = () => {
    const { cart, removeFromCart, total, clearCart, toast } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // This function now runs AFTER Stripe successfully charges the fake card
    const saveOrderToDatabase = async (transactionId) => {
        setLoading(true);
         try {
            const formattedCart = cart.map(item => ({
            id: item.product.id,
            quantity: item.count,
            price: item.product.price,
            quantityType: item.quantityType, // Send the type (e.g., box_60)
            label: item.label                // Send the text (e.g., 1 Box (60 pcs))
            }));
            
            const payload = {
            shopId: user.id,
            distributorId: user.distributorId,
            items: formattedCart,
            totalAmount: total,
            transactionId: transactionId
            };

            await api.placeOrder(payload);
            clearCart();
            setIsOpen(false);
            toast.success('Order placed successfully!');
            navigate('/shop/orders');
        } catch (err) {
            const serverMessage = err.response?.data?.error;
            toast.error(serverMessage || 'Failed to place order: ' + err.message);
        } finally {
        setLoading(false);
        }
    };

    return (
        <>
            <button
                className="btn btn-primary"
                onClick={() => setIsOpen(true)}
                style={{ position: 'relative' }}
            >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                    <span style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        background: 'hsl(var(--secondary))', color: 'white',
                        borderRadius: '50%', width: '20px', height: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 'bold'
                    }}>
                        {cart.length}
                    </span>
                )}
                Cart (₹{total})
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px',
                    background: 'white', boxShadow: 'var(--shadow-lg)', zIndex: 100,
                    display: 'flex', flexDirection: 'column'
                }} className="animate-fade-in">

                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingCart size={24} color="hsl(var(--primary))" /> Your Cart
                        </h3>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                        {cart.length === 0 ? (
                            <div className="flex-center" style={{ height: '100%', flexDirection: 'column', color: 'hsl(var(--text-muted))' }}>
                                <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>Your cart is empty</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {cart.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                                        <img src={item.product.image} alt={item.product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>{item.quantityType}: {item.count} pcs</div>
                                            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>₹{item.product.price} x {item.count} = ₹{item.subtotal}</div>
                                        </div>
                                        <button onClick={() => removeFromCart(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #eee', background: 'hsl(var(--bg-color))' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>
                                <span>Total</span>
                                <span style={{ color: 'hsl(var(--primary))' }}>₹{total}</span>
                            </div>
                            
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '10px', fontWeight: 'bold' }}>
                                    Processing Order... Please wait.
                                </div>
                            ) : (
                                /* --- THE NEW STRIPE BUTTON --- */
                                <StripeCheckout
                                    name="FMCG Connect" 
                                    description={`Your total is ₹${total}`}
                                    amount={total * 100} // Stripe requires paise (total * 100)
                                    currency="INR" 
                                    stripeKey="pk_test_51TAMGfRwANe6MzplreJZ9tCFYAO9BJtqQb7n444yuzLlMbERzjlhJYDJX8SKzPPmALpVkFfIM2LlUtI1jOgR8Ljx00IoocDPxC" // <--- PASTE YOUR KEY HERE!
                                    token={async (token) => {
                                        console.log("Payment Successful! Stripe Token:", token);
                                        // 1. Pass the exact Stripe ID to your existing function!
                                        await saveOrderToDatabase(token.id);
                                    }}
                                >
                                    <button style={{ width: '100%', padding: '12px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                                        Pay ₹{total} Securely
                                    </button>
                                </StripeCheckout>
                            )}

                        </div>
                    )}
                </div>
            )}

            {/* Backdrop overlay */}
            {isOpen && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: '400px', bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Cart;