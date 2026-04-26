import React, { createContext, useContext, useState } from 'react';
import * as api from '../api/Data';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (email, password) => {
        // api.login() already throws with the server's error message on non-2xx.
        // AuthContext just stores what comes back — role is already lowercase from the server.
        const userData = await api.login(email, password);
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
    };

    const register = async (data) => {
        const userData = await api.registerShopOwner(data);
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
