import React, { useState, useEffect } from 'react';
import { getShopsByDistributor } from '../api/Data';
import { useAuth } from '../context/AuthContext';
import { Store, User } from 'lucide-react';

const MyShops = () => {
    const { user } = useAuth();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getShopsByDistributor(user.id).then(data => {
            setShops(data);
            setLoading(false);
        });
    }, [user.id]);

    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Registered Shops</h2>

            {loading ? (
                <div className="flex-center" style={{ minHeight: '300px' }}>Loading shops...</div>
            ) : shops.length === 0 ? (
                <div className="card flex-center" style={{ flexDirection: 'column', height: '300px', color: 'hsl(var(--text-muted))' }}>
                    <Store size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>No shops are currently registered under you.</p>
                </div>
            ) : (
                <div className="grid-cards">
                    {shops.map(shop => (
                        <div key={shop.id} className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'hsl(var(--primary) / 0.1)', borderRadius: '50%', color: 'hsl(var(--primary))' }}>
                                <Store size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{shop.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                                    <User size={14} /> {shop.email}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                                    Joined: {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyShops;
