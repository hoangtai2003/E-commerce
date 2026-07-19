import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronsUpDown, ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOrders, updateOrder, type ApiOrder, type OrderStatus, type PaymentMethod } from '../services/orders';
import { getCustomers } from '../services/customers';
import { getUsers, type ApiUser } from '../services/users';
import type { Customer } from '../types';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

const ORDER_STATUS: Record<OrderStatus, { label: string, tone: string, grad: string }> = {
    pending: { label: "Chờ xử lý", tone: "warning", grad: "var(--grad-amber)" },
    shipping: { label: "Đang giao", tone: "info", grad: "var(--grad-teal)" },
    completed: { label: "Hoàn thành", tone: "success", grad: "var(--grad-primary)" },
    cancelled: { label: "Đã hủy", tone: "danger", grad: "var(--grad-rose)" },
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    cod: "COD",
    transfer: "Chuyển khoản",
    card: "Thẻ tín dụng",
    momo: "Ví MoMo",
    cash: "Tiền mặt",
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

export function Orders() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [staffUsers, setStaffUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [payment, setPayment] = useState('all');
    const [sortKey, setSortKey] = useState<'code' | 'ordered_at' | 'total'>('ordered_at');
    const [sortDir, setSortDir] = useState<-1 | 1>(-1);
    const [page, setPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
    const [editingStatus, setEditingStatus] = useState<OrderStatus>('pending');
    const per = 7;

    useEffect(() => {
        Promise.all([getOrders(), getCustomers(), getUsers()])
            .then(([ordersData, customersData, usersData]) => {
                setOrders(ordersData);
                setCustomers(customersData);
                setStaffUsers(usersData);
            })
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải danh sách đơn hàng từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const customerById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const staffById = useMemo(() => new Map(staffUsers.map(u => [u.id, u])), [staffUsers]);

    const filteredOrders = useMemo(() => {
        const rows = orders.filter((o) => {
            const c = o.customer ? customerById.get(o.customer) : null;
            const matchSearch = o.code.toLowerCase().includes(search.toLowerCase()) || (c?.name.toLowerCase() ?? '').includes(search.toLowerCase());
            const matchStatus = status === 'all' || o.status === status;
            const matchPayment = payment === 'all' || o.payment_method === payment;
            return matchSearch && matchStatus && matchPayment;
        });

        rows.sort((a, b) => {
            const va = sortKey === 'total' ? a.total : sortKey === 'ordered_at' ? a.ordered_at : a.code;
            const vb = sortKey === 'total' ? b.total : sortKey === 'ordered_at' ? b.ordered_at : b.code;
            if (typeof va === 'string' && typeof vb === 'string') {
                return va.localeCompare(vb, "vi") * sortDir;
            }
            if (typeof va === 'number' && typeof vb === 'number') {
                return (va - vb) * sortDir;
            }
            return 0;
        });

        return rows;
    }, [orders, customerById, search, status, payment, sortKey, sortDir]);

    const totalItems = filteredOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / per));
    const currentRows = filteredOrders.slice((page - 1) * per, page * per);

    const handleSort = (key: 'code' | 'ordered_at' | 'total') => {
        if (sortKey === key) {
            setSortDir(prev => (prev === 1 ? -1 : 1));
        } else {
            setSortKey(key);
            setSortDir(1);
        }
    };

    const SortIcon = ({ columnKey }: { columnKey: 'code' | 'ordered_at' | 'total' }) => {
        if (sortKey !== columnKey) return <ChevronsUpDown size={14} />;
        return sortDir === 1 ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder || saving) return;
        setSaving(true);
        try {
            const updated = await updateOrder(selectedOrder.id, { status: editingStatus });
            setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
            showToast('success', 'Đã cập nhật đơn hàng', `${updated.code} chuyển sang "${ORDER_STATUS[updated.status].label}".`);
            setSelectedOrder(null);
        } catch {
            showToast('error', 'Lỗi', 'Không thể cập nhật trạng thái đơn hàng.');
        } finally {
            setSaving(false);
        }
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
                    const count = st === 'all' ? orders.length : orders.filter(o => o.status === st).length;
                    const labels: Record<string, string> = { all: 'Tất cả', pending: 'Chờ xử lý', shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
                    return (
                        <button key={st} className={`status-tab ${status === st ? 'active' : ''}`} onClick={() => { setStatus(st); setPage(1); }}>
                            {labels[st]} <span>{count}</span>
                        </button>
                    );
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
                            {Object.entries(PAYMENT_LABELS).map(([k, label]) => (
                                <option key={k} value={k}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="sortable" onClick={() => handleSort('code')}>Mã đơn <SortIcon columnKey="code" /></th>
                                <th>Khách hàng</th>
                                <th className="sortable" onClick={() => handleSort('ordered_at')}>Ngày đặt <SortIcon columnKey="ordered_at" /></th>
                                <th>Thanh toán</th>
                                <th className="sortable" onClick={() => handleSort('total')}>Tổng tiền <SortIcon columnKey="total" /></th>
                                <th>Trạng thái</th>
                                <th className="th-actions">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <strong>Đang tải…</strong>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentRows.length === 0 ? (
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
                                    const c = o.customer ? customerById.get(o.customer) : null;
                                    const s = ORDER_STATUS[o.status];
                                    return (
                                        <tr key={o.id}>
                                            <td data-label="Mã đơn">
                                                <strong>{o.code}</strong><span className="cell-sub">{o.items.length} sản phẩm</span>
                                            </td>
                                            <td data-label="Khách hàng">
                                                <div className="cell-person">
                                                    <div className="avatar avatar--sm">{initials(c?.name || "Khách lẻ")}</div>
                                                    <div><strong>{c?.name ?? "Khách lẻ"}</strong><small>{c?.phone}</small></div>
                                                </div>
                                            </td>
                                            <td data-label="Ngày đặt" className="cell-muted">{fmtDate(o.ordered_at)}</td>
                                            <td data-label="Thanh toán" className="cell-muted">{PAYMENT_LABELS[o.payment_method]}</td>
                                            <td data-label="Tổng tiền" className="cell-money">{fmtMoney(o.total)}</td>
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
                title={`Đơn hàng ${selectedOrder?.code ?? ''}`}
                size="lg"
                footer={
                    <>
                        <button className="btn btn--ghost" onClick={() => setSelectedOrder(null)}>Đóng</button>
                        <button className="btn btn--primary" onClick={handleUpdateStatus} disabled={saving}>
                            {saving ? 'Đang lưu…' : 'Cập nhật trạng thái'}
                        </button>
                    </>
                }
            >
                {selectedOrder && (() => {
                    const c = selectedOrder.customer ? customerById.get(selectedOrder.customer) : null;
                    const staff = selectedOrder.staff ? staffById.get(selectedOrder.staff) : null;
                    return (
                        <div>
                            <div className="order-meta">
                                <div className="order-meta__item">
                                    <small>Khách hàng</small>
                                    <strong>{c?.name ?? "Khách lẻ"}</strong>
                                    <span className="cell-sub">{c ? `${c.phone} · ${c.email}` : 'Không có thông tin liên hệ'}</span>
                                </div>
                                <div className="order-meta__item">
                                    <small>Thanh toán</small>
                                    <strong>{PAYMENT_LABELS[selectedOrder.payment_method]}</strong>
                                    <span className="cell-sub">Đặt lúc {fmtDate(selectedOrder.ordered_at)}{staff ? ` · NV: ${staff.full_name}` : ''}</span>
                                </div>
                            </div>

                            <div className="order-items">
                                {selectedOrder.items.map((it) => (
                                    <div className="order-item" key={it.id}>
                                        <div>
                                            <strong style={{ fontSize: 13.5 }}>{it.product_name}</strong>
                                            <div className="order-item__qty">{it.variant_name ?? '—'} · SL: {it.quantity}</div>
                                        </div>
                                        <span className="order-item__price">{fmtMoney(it.line_total)}</span>
                                    </div>
                                ))}
                                <div className="order-total" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className="cell-sub">Tạm tính</span>
                                        <span className="cell-sub">{fmtMoney(selectedOrder.subtotal)}</span>
                                    </div>
                                    {selectedOrder.discount_amount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="cell-sub">Giảm giá</span>
                                            <span className="cell-sub">-{fmtMoney(selectedOrder.discount_amount)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tổng cộng</span>
                                        <span>{fmtMoney(selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <label className="field">
                                <span>Trạng thái đơn hàng</span>
                                <select className="select select--full" value={editingStatus} onChange={e => setEditingStatus(e.target.value as OrderStatus)}>
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
