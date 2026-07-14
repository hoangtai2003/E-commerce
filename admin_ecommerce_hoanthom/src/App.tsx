import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Settings } from './pages/Settings';
import { Orders } from './pages/Orders';
import { Customers } from './pages/Customers';
import { Promos } from './pages/Promos';
import { Staff } from './pages/Staff';
import { Login } from './pages/Login';
import { POS } from './pages/POS';
import { ToastProvider } from './contexts/ToastContext';
import './assets/style.css'; // Import CSS toàn cục

function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="pos" element={<POS />} />
                        <Route path="products" element={<Products />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="promos" element={<Promos />} />
                        <Route path="staff" element={<Staff />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;
