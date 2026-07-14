import { useState, useMemo } from 'react';
import { Search, ChevronsUpDown, ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockOrders, mockCustomers, mockProducts } from '../data/mock';
import type { Order } from '../types';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

const ORDER_STATUS: Record<string, { label: string, tone: string, grad: string }> = {
  pending:   { label: "Chờ xử lý",  tone: "warning", grad: "var(--grad-amber)" },
  shipping:  { label: "Đang giao",  tone: "info",    grad: "var(--grad-teal)" },
  completed: { label: "Hoàn thành", tone: "success", grad: "var(--grad-primary)" },
  cancelled: { label: "Đã hủy",     tone: "danger",  grad: "var(--grad-rose)" },
};

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

const orderTotal = (order: typeof mockOrders[0]) =>
  order.items.reduce((sum, it) => {
    const p = mockProducts.find((x) => x.id === it.productId);
    return sum + (p ? p.price * it.qty : 0);
  }, 0);

export function Orders() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [sortKey, setSortKey] = useState<keyof Order | 'total'>('date');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>('');
  const per = 7;

  const filteredOrders = useMemo(() => {
    let rows = mockOrders.filter((o) => {
      const c = mockCustomers.find((x) => x.id === o.customerId);
      const matchSearch = o.code.toLowerCase().includes(search.toLowerCase()) || c?.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === 'all' || o.status === status;
      const matchPayment = payment === 'all' || o.payment === payment;
      return matchSearch && matchStatus && matchPayment;
    });

    rows.sort((a, b) => {
      const va = sortKey === "total" ? orderTotal(a) : a[sortKey as keyof Order];
      const vb = sortKey === "total" ? orderTotal(b) : b[sortKey as keyof Order];
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb, "vi") * sortDir;
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * sortDir;
      }
      return 0;
    });

    return rows;
  }, [search, status, payment, sortKey, sortDir]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / per));
  const currentRows = filteredOrders.slice((page - 1) * per, page * per);

  const handleSort = (key: keyof Order | 'total') => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Order | 'total' }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown size={14} />;
    return sortDir === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <section className="page active" id="page-orders" data-title="Đơn hàng">
      <div className="page-head">
        <div>
          <h1>Đơn hàng</h1>
          <p className="page-sub">Theo dõi và xử lý đơn hàng của khách.</p>
        </div>
      </div>

      <div className="status-tabs">
        {['all', 'pending', 'shipping', 'completed', 'cancelled'].map(st => {
          const count = st === 'all' ? mockOrders.length : mockOrders.filter(o => o.status === st).length;
          const labels: Record<string, string> = { all: 'Tất cả', pending: 'Chờ xử lý', shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
          return (
            <button key={st} className={`status-tab ${status === st ? 'active' : ''}`} onClick={() => { setStatus(st); setPage(1); }}>
              {labels[st]} <span>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search search--table">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo mã đơn hoặc tên khách…" 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="toolbar__filters">
            <select className="select" value={payment} onChange={e => { setPayment(e.target.value); setPage(1); }}>
              <option value="all">Mọi thanh toán</option>
              <option value="COD">COD</option>
              <option value="Chuyển khoản">Chuyển khoản</option>
              <option value="Thẻ tín dụng">Thẻ tín dụng</option>
              <option value="Ví MoMo">Ví MoMo</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('code')}>Mã đơn <SortIcon columnKey="code" /></th>
                <th>Khách hàng</th>
                <th className="sortable" onClick={() => handleSort('date')}>Ngày đặt <SortIcon columnKey="date" /></th>
                <th>Thanh toán</th>
                <th className="sortable" onClick={() => handleSort('total')}>Tổng tiền <SortIcon columnKey="total" /></th>
                <th>Trạng thái</th>
                <th className="th-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <strong>Không có đơn hàng nào</strong>
                      <p>Chưa có đơn hàng khớp với bộ lọc hiện tại.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRows.map(o => {
                  const c = mockCustomers.find((x) => x.id === o.customerId);
                  const s = ORDER_STATUS[o.status];
                  return (
                    <tr key={o.id}>
                      <td data-label="Mã đơn">
                        <strong>{o.code}</strong><span className="cell-sub">{o.items.length} sản phẩm</span>
                      </td>
                      <td data-label="Khách hàng">
                        <div className="cell-person">
                          <div className="avatar avatar--sm">{initials(c?.name || "Khách hàng")}</div>
                          <div><strong>{c?.name}</strong><small>{c?.phone}</small></div>
                        </div>
                      </td>
                      <td data-label="Ngày đặt" className="cell-muted">{fmtDate(o.date)}</td>
                      <td data-label="Thanh toán" className="cell-muted">{o.payment}</td>
                      <td data-label="Tổng tiền" className="cell-money">{fmtMoney(orderTotal(o))}</td>
                      <td data-label="Trạng thái"><span className={`badge badge--${s.tone}`}>{s.label}</span></td>
                      <td data-label="" className="td-actions">
                        <button className="icon-btn icon-btn--sm" title="Xem chi tiết" onClick={() => {
                          setSelectedOrder(o);
                          setEditingStatus(o.status);
                        }}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <p className="table-count">
            {totalItems > 0 ? `Hiển thị ${(page - 1) * per + 1}–${Math.min(page * per, totalItems)} trong ${totalItems} đơn hàng` : "0 đơn hàng"}
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

      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title={`Đơn hàng ${selectedOrder?.code}`}
        size="lg"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setSelectedOrder(null)}>Đóng</button>
            <button className="btn btn--primary" onClick={() => {
              showToast('success', 'Đã cập nhật đơn hàng', `${selectedOrder?.code} chuyển sang "${ORDER_STATUS[editingStatus]?.label}".`);
              setSelectedOrder(null);
            }}>Cập nhật trạng thái</button>
          </>
        }
      >
        {selectedOrder && (() => {
          const c = mockCustomers.find(x => x.id === selectedOrder.customerId);
          return (
            <div>
              <div className="order-meta">
                <div className="order-meta__item">
                  <small>Khách hàng</small>
                  <strong>{c?.name}</strong>
                  <span className="cell-sub">{c?.phone} · {c?.email}</span>
                </div>
                <div className="order-meta__item">
                  <small>Thanh toán</small>
                  <strong>{selectedOrder.payment}</strong>
                  <span className="cell-sub">Đặt lúc {fmtDate(selectedOrder.date)}</span>
                </div>
              </div>

              <div className="order-items">
                {selectedOrder.items.map((it, idx) => {
                  const p = mockProducts.find(x => x.id === it.productId);
                  if (!p) return null;
                  return (
                    <div className="order-item" key={idx}>
                      <div className="cell-product__thumb" style={{ background: p.tint }}>{p.emoji}</div>
                      <div>
                        <strong style={{ fontSize: 13.5 }}>{p.name}</strong>
                        <div className="order-item__qty">{it.variant} · SL: {it.qty}</div>
                      </div>
                      <span className="order-item__price">{fmtMoney(p.price * it.qty)}</span>
                    </div>
                  );
                })}
                <div className="order-total">
                  <span>Tổng cộng</span>
                  <span>{fmtMoney(orderTotal(selectedOrder))}</span>
                </div>
              </div>

              <label className="field">
                <span>Trạng thái đơn hàng</span>
                <select className="select select--full" value={editingStatus} onChange={e => setEditingStatus(e.target.value)}>
                  {Object.entries(ORDER_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </label>
            </div>
          );
        })()}
      </Modal>
    </section>
  );
}
