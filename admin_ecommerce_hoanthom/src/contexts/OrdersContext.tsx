import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { getOrders } from '../services/orders';
import type { ApiOrder } from '../services/orders';

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
        refreshOrders();
    }, [refreshOrders]);

    const pendingCount = orders.filter(o => o.status === 'pending').length;

    return (
        <OrdersContext.Provider value={{ orders, setOrders, loading, pendingCount, refreshOrders }}>
            {children}
        </OrdersContext.Provider>
    );
}
