
import { NavLink } from 'react-router-dom';
import {
    Sparkles,
    X,
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    TicketPercent,
    ShieldCheck,
    Settings,
    ChevronsLeft,
    ScanBarcode,
    Tags,
    Truck,
    Warehouse
} from 'lucide-react';
import { useOrders } from '../../contexts/OrdersContext';
import { useAuth } from '../../contexts/AuthContext';

const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

interface SidebarProps {
    isMobileOpen: boolean;
    onCloseMobile: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed, onToggleCollapse }: SidebarProps) {
    const { pendingCount } = useOrders();
    const { user } = useAuth();

    return (
        <>
            <aside
                className={`sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                id="sidebar"
                aria-label="Điều hướng chính"
            >
                <div className="sidebar__brand">
                    <div className="brand-mark" aria-hidden="true">
                        <Sparkles size={20} />
                    </div>
                    <div className="brand-text">
                        <span className="brand-name">Aurora</span>
                        <span className="brand-sub">E-commerce Admin</span>
                    </div>
                    <button className="icon-btn sidebar__close" onClick={onCloseMobile} aria-label="Đóng menu">
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar__nav">
                    <NavLink to="/pos" className={({ isActive }) => `nav-item pos-nav-item ${isActive ? 'active' : ''}`}>
                        <ScanBarcode size={20} /><span className="nav-text">Bán hàng</span>
                    </NavLink>

                    <p className="nav-label">Tổng quan</p>
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                        <LayoutDashboard size={20} /><span className="nav-text">Dashboard</span>
                    </NavLink>

                    <p className="nav-label">Vận hành</p>
                    <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Package size={20} /><span className="nav-text">Sản phẩm</span>
                    </NavLink>
                    <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Warehouse size={20} /><span className="nav-text">Kho hàng</span>
                    </NavLink>
                    <NavLink to="/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Tags size={20} /><span className="nav-text">Danh mục</span>
                    </NavLink>
                    <NavLink to="/suppliers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Truck size={20} /><span className="nav-text">Nhà cung cấp</span>
                    </NavLink>
                    <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShoppingCart size={20} /><span className="nav-text">Đơn hàng</span>
                        {pendingCount > 0 && <span className="nav-badge" id="ordersNavBadge">{pendingCount}</span>}
                    </NavLink>
                    <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={20} /><span className="nav-text">Khách hàng</span>
                    </NavLink>
                    <NavLink to="/promos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <TicketPercent size={20} /><span className="nav-text">Khuyến mãi</span>
                    </NavLink>

                    <p className="nav-label">Hệ thống</p>
                    <NavLink to="/staff" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShieldCheck size={20} /><span className="nav-text">Nhân viên</span>
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Settings size={20} /><span className="nav-text">Cài đặt</span>
                    </NavLink>
                </nav>

                <div className="sidebar__footer">
                    <div className="sidebar__user">
                        <div className="avatar avatar--sm">{user ? initials(user.full_name) : '?'}</div>
                        <div className="sidebar__user-info nav-text">
                            <strong>{user?.full_name ?? 'Đang tải…'}</strong>
                            <span>{user?.email ?? ''}</span>
                        </div>
                    </div>
                    <button
                        className="icon-btn collapse-btn"
                        onClick={onToggleCollapse}
                        aria-label="Thu gọn sidebar"
                        title="Thu gọn / Mở rộng"
                    >
                        <ChevronsLeft size={20} />
                    </button>
                </div>
            </aside>

            {isMobileOpen && <div className="overlay" id="overlay" onClick={onCloseMobile}></div>}
        </>
    );
}
