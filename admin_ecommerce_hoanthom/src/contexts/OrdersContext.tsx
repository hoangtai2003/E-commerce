import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { getOrders } from '../services/orders';
import type { ApiOrder } from '../services/orders';
import { useAuth } from './AuthContext';

interface OrdersContextType {
    orders: ApiOrder[];
    setOrders: Dispatch<SetStateAction<ApiOrder[]>>;
    loading: boolean;
    pendingCount: number;
    refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function useOrders() {
    const context = useContext(OrdersContext);
    if (!context) {
        throw new Error('useOrders must be used within an OrdersProvider');
    }
    return context;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshOrders = useCallback(async () => {
        try {
            const data = await getOrders();
            setOrders(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (user) {
            refreshOrders();
        } else {
            setLoading(false);
        }
    }, [user, authLoading, refreshOrders]);

    const pendingCount = orders.filter(o => o.status === 'pending').length;

    return (
        <OrdersContext.Provider value={{ orders, setOrders, loading, pendingCount, refreshOrders }}>
            {children}
        </OrdersContext.Provider>
    );
}
