import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../api/Data';

const RegisterDistributor = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.registerShopOwner({ ...formData, role: 'DISTRIBUTOR' });
            // Redirect to login after successful registration
            navigate('/login', { state: { message: 'Distributor account created successfully! Please log in.' } });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to register distributor');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="flex-center" style={{ minHeight: '80vh' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2>Distributor Application</h2>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>Partner with us to supply local shops</p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#fee2e2', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Company Name</label>
                        <input
                            type="text" name="name" className="input-field"
                            value={formData.name} onChange={handleChange} required
                            placeholder="Alpha Distributors LLC"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Business Email</label>
                        <input
                            type="email" name="email" className="input-field"
                            value={formData.email} onChange={handleChange} required
                            placeholder="contact@alphadistrants.com"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password" name="password" className="input-field"
                            value={formData.password} onChange={handleChange} required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Submitting Application...' : 'Apply as Distributor'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>
                        Already have an account? <Link to="/login" style={{ color: 'hsl(var(--primary))', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterDistributor;
