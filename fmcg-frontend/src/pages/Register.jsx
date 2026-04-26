import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDistributors } from '../api/Data';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        distributorId: ''
    });
    const [distributors, setDistributors] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        getDistributors().then(setDistributors);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to register');
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
                    <h2>Shop Registration</h2>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>Create an account to start ordering</p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#fee2e2', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Shop Name</label>
                        <input
                            type="text" name="name" className="input-field"
                            value={formData.name} onChange={handleChange} required
                            placeholder="Grocery Mart"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email" name="email" className="input-field"
                            value={formData.email} onChange={handleChange} required
                            placeholder="shop@example.com"
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

                    <div className="input-group">
                        <label className="input-label">Select Distributor</label>
                        <select
                            name="distributorId" className="input-field select-field"
                            value={formData.distributorId} onChange={handleChange} required
                        >
                            <option value="" disabled>Choose a distributor in your area</option>
                            {distributors.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register Shop'}
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

export default Register;
