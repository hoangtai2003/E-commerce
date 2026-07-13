
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
  ChevronsLeft
} from 'lucide-react';
import { mockOrders } from '../../data/mock';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed, onToggleCollapse }: SidebarProps) {
  // Đếm đơn hàng đang chờ xử lý
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;

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
          <p className="nav-label">Tổng quan</p>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} /><span className="nav-text">Dashboard</span>
          </NavLink>

          <p className="nav-label">Vận hành</p>
          <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Package size={20} /><span className="nav-text">Sản phẩm</span>
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={20} /><span className="nav-text">Đơn hàng</span>
            {pendingOrders > 0 && <span className="nav-badge" id="ordersNavBadge">{pendingOrders}</span>}
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
            <div className="avatar avatar--sm">ML</div>
            <div className="sidebar__user-info nav-text">
              <strong>Minh Lê</strong>
              <span>Quản trị viên</span>
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

      {/* Lớp phủ khi mở drawer trên mobile */}
      {isMobileOpen && <div className="overlay" id="overlay" onClick={onCloseMobile}></div>}
    </>
  );
}
