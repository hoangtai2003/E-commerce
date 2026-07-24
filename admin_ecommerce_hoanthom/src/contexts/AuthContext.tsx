import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getMe, login as apiLogin, logout as apiLogout, type ApiMe } from '../services/auth';

interface AuthContextType {
    user: ApiMe | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<ApiMe | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshMe = useCallback(async () => {
        try {
            const me = await getMe();
            setUser(me);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshMe();
    }, [refreshMe]);

    useEffect(() => {
        const handleExpired = () => setUser(null);
        window.addEventListener('auth:expired', handleExpired);
        return () => window.removeEventListener('auth:expired', handleExpired);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const me = await apiLogin(email, password);
        setUser(me);
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } finally {
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshMe }}>
            {children}
        </AuthContext.Provider>
    );
}
