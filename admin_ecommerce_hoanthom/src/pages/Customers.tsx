import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronsUpDown, ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockOrders, mockProducts } from '../data/mock';
import type { Customer, Order } from '../types';
import { Modal } from '../components/ui/Modal';
import { getCustomers } from '../services/customers';
import { useToast } from '../contexts/ToastContext';

const TIER: Record<string, { label: string, tone: string }> = {
    vip: { label: "VIP", tone: "primary" },
    loyal: { label: "Thân thiết", tone: "info" },
    new: { label: "Mới", tone: "neutral" },
};

const ORDER_STATUS: Record<string, { label: string, tone: string }> = {
    pending: { label: "Chờ xử lý", tone: "warning" },
    shipping: { label: "Đang giao", tone: "primary" },
    completed: { label: "Hoàn thành", tone: "success" },
    cancelled: { label: "Đã hủy", tone: "danger" },
};

const fmtDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')} · ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
};

const orderTotal = (o: Order) => o.items.reduce((sum, it) => {
    const p = mockProducts.find(x => x.id === it.productId);
    return sum + (p ? p.price * it.qty : 0);
}, 0);

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

export function Customers() {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [tier, setTier] = useState('all');
    const [sortKey, setSortKey] = useState<keyof Customer>('joined');
    const [sortDir, setSortDir] = useState<-1 | 1>(-1);
    const [page, setPage] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const per = 7;

    useEffect(() => {
        getCustomers()
            .then(setCustomers)
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải danh sách khách hàng từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const filteredCustomers = useMemo(() => {
        let rows = customers.filter((c) => {
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
    }, [customers, search, tier, sortKey, sortDir]);

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
                            {loading ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty-state">
                                            <strong>Đang tải…</strong>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentRows.length === 0 ? (
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
                                                <div className="avatar avatar--sm" style={{ background: `var(--grad-${TIER[c.tier]?.tone || 'primary'})` }}>{initials(c.name)}</div>
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
                                            <button className="icon-btn icon-btn--sm" title="Xem hồ sơ" onClick={() => setSelectedCustomer(c)}>
                                                <Eye size={16} />
                                            </button>
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

            <Modal
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                title=""
                size="lg"
            >
                {selectedCustomer && (() => {
                    const history = mockOrders.filter(o => o.customerId === selectedCustomer.id).sort((a, b) => b.date.localeCompare(a.date));

                    return (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                                <div className="avatar" style={{ width: 48, height: 48, fontSize: 16, background: `var(--grad-${TIER[selectedCustomer.tier]?.tone || 'primary'})` }}>
                                    {initials(selectedCustomer.name)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, marginBottom: 4, fontWeight: 700 }}>{selectedCustomer.name}</h3>
                                    <small style={{ color: 'var(--text-3)' }}>
                                        Khách hàng {TIER[selectedCustomer.tier]?.label} · từ {new Date(selectedCustomer.joined).toLocaleDateString('vi-VN')}
                                    </small>
                                </div>
                            </div>

                            <div className="order-meta">
                                <div className="order-meta__item">
                                    <small>EMAIL</small>
                                    <strong>{selectedCustomer.email}</strong>
                                </div>
                                <div className="order-meta__item">
                                    <small>ĐIỆN THOẠI</small>
                                    <strong>{selectedCustomer.phone}</strong>
                                </div>
                                <div className="order-meta__item">
                                    <small>TỔNG ĐƠN HÀNG</small>
                                    <strong>{selectedCustomer.orders} đơn</strong>
                                </div>
                                <div className="order-meta__item">
                                    <small>TỔNG CHI TIÊU</small>
                                    <strong>{fmtMoney(selectedCustomer.spent)}</strong>
                                </div>
                            </div>

                            <p style={{ fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 12, marginTop: 24 }}>Lịch sử mua hàng gần đây</p>

                            {history.length > 0 ? (
                                <div className="order-items">
                                    {history.map(o => (
                                        <div className="order-item" key={o.id}>
                                            <div>
                                                <strong style={{ fontSize: 13.5 }}>{o.code}</strong>
                                                <div className="order-item__qty">{fmtDate(o.date)} · {o.payment}</div>
                                            </div>
                                            <span className={`badge badge--${ORDER_STATUS[o.status]?.tone}`} style={{ marginLeft: 'auto' }}>
                                                {ORDER_STATUS[o.status]?.label}
                                            </span>
                                            <span className="order-item__price" style={{ marginLeft: 14 }}>
                                                {fmtMoney(orderTotal(o))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state__icon" style={{ background: 'var(--surface-2)' }}></div>
                                    <strong>Chưa có đơn hàng</strong>
                                    <p>Khách hàng này chưa phát sinh giao dịch gần đây.</p>
                                </div>
                            )}

                            <div className="modal__foot" style={{ padding: '20px 0 0', marginTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn--ghost" onClick={() => setSelectedCustomer(null)}>Đóng</button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

        </section>
    );
}
