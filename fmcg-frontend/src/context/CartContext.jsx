import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    // 1. Initialize cart from localStorage if it exists, otherwise start with empty array
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('shopping_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Toast state built directly into CartContext
    const [toasts, setToasts] = useState([]);

    // 2. Save to localStorage every time the cart state changes
    useEffect(() => {
        localStorage.setItem('shopping_cart', JSON.stringify(cart));
    }, [cart]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (msg, duration) => addToast(msg, 'success', duration),
        error:   (msg, duration) => addToast(msg, 'error',   duration),
        warning: (msg, duration) => addToast(msg, 'warning', duration),
    };

    // Cart logic
    const addToCart = (product, quantity, subtotal) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id && item.quantityType === quantity.type);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id && item.quantityType === quantity.type
                        ? { ...item, count: item.count + quantity.count, subtotal: item.subtotal + subtotal }
                        : item
                );
            }
            return [...prev, { product, quantityType: quantity.type, count: quantity.count, label: quantity.label, subtotal }];
        });
    };

    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCart([]);
        // 3. Clear from localStorage when cart is explicitly cleared (e.g., successful payment)
        localStorage.removeItem('shopping_cart');
    };

    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, toasts, removeToast, toast }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);