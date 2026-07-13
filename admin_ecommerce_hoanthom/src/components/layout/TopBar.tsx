import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Moon, Sun, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { mockNotifs } from '../../data/mock';

interface TopBarProps {
  onOpenMobile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function TopBar({ onOpenMobile, isDarkMode, onToggleTheme }: TopBarProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifs, setNotifs] = useState(mockNotifs);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifs.filter(n => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, unread: false })));
  };

  const tones: Record<string, [string, string]> = { 
    primary: ["var(--primary-soft)", "var(--primary)"], 
    warning: ["var(--warning-soft)", "var(--warning)"], 
    success: ["var(--success-soft)", "var(--success)"], 
    info: ["var(--info-soft)", "var(--info)"] 
  };

  return (
    <header className="topbar">
      <button className="icon-btn hamburger" onClick={onOpenMobile} aria-label="Mở menu">
        <Menu size={20} />
      </button>

      <div className="search" role="search">
        <Search size={18} />
        <input 
          type="text" 
          placeholder="Tìm sản phẩm, đơn hàng, khách hàng…" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <kbd>/</kbd>
      </div>

      <div className="topbar__actions">
        <button 
          className="icon-btn" 
          onClick={onToggleTheme} 
          aria-label="Chuyển chế độ sáng / tối"
          title="Chế độ sáng / tối"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className={`dropdown ${isNotifOpen ? 'open' : ''}`} ref={notifRef}>
          <button className="icon-btn" onClick={() => setIsNotifOpen(!isNotifOpen)} aria-label="Thông báo">
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge-dot" id="notifBadge">{unreadCount}</span>}
          </button>
          <div className="dropdown__panel dropdown__panel--wide">
            <div className="dropdown__head">
              <strong>Thông báo</strong>
              <button className="link-btn" onClick={markAllRead}>Đánh dấu đã đọc</button>
            </div>
            <div className="notif-list">
              {notifs.map(n => {
                const [bg, fg] = tones[n.tone] || tones.info;
                // Ánh xạ chuỗi icon tĩnh từ mock sang Lucide Component nếu cần, nhưng để đơn giản ta có thể dùng SVG hoặc tên lớp.
                // Trong thực tế, mock trả về string như "ShoppingCart".
                return (
                  <div key={n.id} className={`notif-item ${n.unread ? "unread" : ""}`}>
                    <div className="notif-item__icon" style={{ background: bg, color: fg }}>
                      <Bell size={18} /> {/* Tạm dùng Bell icon chung */}
                    </div>
                    <div>
                      <strong>{n.title}</strong>
                      <p>{n.text}</p>
                      <time>{n.time}</time>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`dropdown ${isUserOpen ? 'open' : ''}`} ref={userRef}>
          <button className="user-chip" onClick={() => setIsUserOpen(!isUserOpen)} aria-haspopup="menu">
            <div className="avatar">ML</div>
            <span className="user-chip__name">Minh Lê</span>
            <ChevronDown size={16} />
          </button>
          <div className="dropdown__panel" role="menu">
            <Link to="/settings" className="dropdown__item" onClick={() => setIsUserOpen(false)}>
              <User size={16} /> Hồ sơ của tôi
            </Link>
            <Link to="/settings" className="dropdown__item" onClick={() => setIsUserOpen(false)}>
              <Settings size={16} /> Cài đặt
            </Link>
            <hr />
            <button className="dropdown__item dropdown__item--danger" onClick={() => { setIsUserOpen(false); navigate('/login'); }} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit'}}>
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
