import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Settings } from './pages/Settings';
import { Orders } from './pages/Orders';
import { Returns } from './pages/Returns';
import { SupplierReturns } from './pages/SupplierReturns';
import { Customers } from './pages/Customers';
import { Promos } from './pages/Promos';
import { Staff } from './pages/Staff';
import { Login } from './pages/Login';
import { Categories } from './pages/Categories';
import { Suppliers } from './pages/Suppliers';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { OrdersProvider } from './contexts/OrdersContext';
import './assets/style.css'; // Import CSS toàn cục

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <OrdersProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                                <Route index element={<Dashboard />} />
                                <Route path="pos" element={<POS />} />
                                <Route path="products" element={<Products />} />
                                <Route path="categories" element={<Categories />} />
                                <Route path="suppliers" element={<Suppliers />} />
                                <Route path="inventory" element={<Inventory />} />
                                <Route path="orders" element={<Orders />} />
                                <Route path="returns" element={<Returns />} />
                                <Route path="supplier-returns" element={<SupplierReturns />} />
                                <Route path="customers" element={<Customers />} />
                                <Route path="promos" element={<Promos />} />
                                <Route path="staff" element={<Staff />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </OrdersProvider>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
