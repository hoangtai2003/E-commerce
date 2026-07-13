import { useState, useMemo } from 'react';
import { Search, ChevronsUpDown, ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockCustomers } from '../data/mock';
import type { Customer } from '../types';

const TIER: Record<string, { label: string, tone: string }> = {
  vip:   { label: "VIP",        tone: "primary" },
  loyal: { label: "Thân thiết", tone: "info" },
  new:   { label: "Mới",        tone: "neutral" },
};

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

export function Customers() {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('all');
  const [sortKey, setSortKey] = useState<keyof Customer>('joined');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [page, setPage] = useState(1);
  const per = 7;

  const filteredCustomers = useMemo(() => {
    let rows = mockCustomers.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""));
      const matchTier = tier === 'all' || c.tier === tier;
      return matchSearch && matchTier;
    });

    rows.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb, "vi") * sortDir;
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * sortDir;
      }
      return 0;
    });

    return rows;
  }, [search, tier, sortKey, sortDir]);

  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / per));
  const currentRows = filteredCustomers.slice((page - 1) * per, page * per);

  const handleSort = (key: keyof Customer) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Customer }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown size={14} />;
    return sortDir === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <section className="page active" id="page-customers" data-title="Khách hàng">
      <div className="page-head">
        <div>
          <h1>Khách hàng</h1>
          <p className="page-sub">Chân dung và lịch sử mua sắm của khách.</p>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search search--table">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên, email, SĐT…" 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="toolbar__filters">
            <select className="select" value={tier} onChange={e => { setTier(e.target.value); setPage(1); }}>
              <option value="all">Mọi hạng</option>
              <option value="vip">VIP</option>
              <option value="loyal">Thân thiết</option>
              <option value="new">Mới</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('name')}>Khách hàng <SortIcon columnKey="name" /></th>
                <th>Liên hệ</th>
                <th className="sortable" onClick={() => handleSort('orders')}>Đơn hàng <SortIcon columnKey="orders" /></th>
                <th className="sortable" onClick={() => handleSort('spent')}>Tổng chi tiêu <SortIcon columnKey="spent" /></th>
                <th>Hạng</th>
                <th className="th-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <strong>Không tìm thấy khách hàng</strong>
                      <p>Thử tìm bằng tên, email hoặc số điện thoại khác.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRows.map(c => (
                  <tr key={c.id}>
                    <td data-label="Khách hàng">
                      <div className="cell-person">
                        <div className="avatar avatar--sm">{initials(c.name)}</div>
                        <div>
                          <strong>{c.name}</strong>
                          <small>Tham gia {new Date(c.joined).toLocaleDateString("vi-VN")}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Liên hệ">
                      <span style={{ display: "block" }}>{c.email}</span>
                      <span className="cell-sub">{c.phone}</span>
                    </td>
                    <td data-label="Đơn hàng" className="cell-muted">{c.orders} đơn</td>
                    <td data-label="Tổng chi tiêu" className="cell-money">{fmtMoney(c.spent)}</td>
                    <td data-label="Hạng">
                      <span className={`badge badge--${TIER[c.tier].tone}`}>{TIER[c.tier].label}</span>
                    </td>
                    <td data-label="" className="td-actions">
                      <button className="icon-btn icon-btn--sm" title="Xem hồ sơ"><Eye size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <p className="table-count">
            {totalItems > 0 ? `Hiển thị ${(page - 1) * per + 1}–${Math.min(page * per, totalItems)} trong ${totalItems} khách hàng` : "0 khách hàng"}
          </p>
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
