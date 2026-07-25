import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    getReturns,
    createReturn,
    approveReturn,
    rejectReturn,
    type ApiReturn,
    type ReturnStatus,
    type RefundMethod,
} from '../services/returns';
import { getOrders, type ApiOrder, type ApiOrderItem } from '../services/orders';
import { getCustomers } from '../services/customers';
import { getUsers, type ApiUser } from '../services/users';
import type { Customer } from '../types';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

const RETURN_STATUS: Record<ReturnStatus, { label: string; tone: string }> = {
    pending: { label: 'Chờ duyệt', tone: 'warning' },
    approved: { label: 'Đã duyệt', tone: 'success' },
    rejected: { label: 'Đã từ chối', tone: 'danger' },
};

const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
    cash: 'Tiền mặt',
    transfer: 'Chuyển khoản',
    card: 'Thẻ tín dụng',
    momo: 'Ví MoMo',
};

const fmtMoney = (n: number) => n.toLocaleString('vi-VN') + '₫';
const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function Returns() {
    const { showToast } = useToast();

    const [returns, setReturns] = useState<ApiReturn[]>([]);
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [staffUsers, setStaffUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const per = 10;

    const [selectedReturn, setSelectedReturn] = useState<ApiReturn | null>(null);
    const [refundMethod, setRefundMethod] = useState<RefundMethod>('cash');
    const [processing, setProcessing] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
    const [returnQuantities, setReturnQuantities] = useState<Record<number, string>>({});
    const [reason, setReason] = useState('');
    const [creating, setCreating] = useState(false);

    const loadAll = () => {
        return Promise.all([getReturns(), getOrders(), getCustomers(), getUsers()])
            .then(([returnsData, ordersData, customersData, usersData]) => {
                setReturns(returnsData);
                setOrders(ordersData);
                setCustomers(customersData);
                setStaffUsers(usersData);
            });
    };

    useEffect(() => {
        loadAll()
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải dữ liệu trả hàng từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const orderById = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders]);
    const customerById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const staffById = useMemo(() => new Map(staffUsers.map(u => [u.id, u])), [staffUsers]);

    const returnedQtyByOrderItem = useMemo(() => {
        const map = new Map<number, number>();
        for (const r of returns) {
            if (r.status === 'rejected') continue;
            for (const ri of r.items) {
                map.set(ri.order_item, (map.get(ri.order_item) ?? 0) + ri.quantity);
            }
        }
        return map;
    }, [returns]);

    const remainingQty = (item: ApiOrderItem) => item.quantity - (returnedQtyByOrderItem.get(item.id) ?? 0);

    const orderSearchResults = useMemo(() => {
        if (!orderSearch.trim()) return [];
        const q = orderSearch.toLowerCase().trim();
        return orders
            .filter(o => o.status === 'completed')
            .filter(o => {
                const c = o.customer ? customerById.get(o.customer) : null;
                return o.code.toLowerCase().includes(q) || (c?.name.toLowerCase() ?? '').includes(q);
            })
            .slice(0, 8);
    }, [orders, orderSearch, customerById]);

    const filteredReturns = useMemo(() => {
        const q = search.toLowerCase();
        return returns.filter(r => {
            const order = orderById.get(r.order);
            const c = order?.customer ? customerById.get(order.customer) : null;
            const matchSearch = r.code.toLowerCase().includes(q) || (order?.code.toLowerCase() ?? '').includes(q) || (c?.name.toLowerCase() ?? '').includes(q);
            const matchStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [returns, search, statusFilter, orderById, customerById]);

    const totalItems = filteredReturns.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / per));
    const currentRows = filteredReturns.slice((page - 1) * per, page * per);

    const openDetail = (r: ApiReturn) => {
        setSelectedReturn(r);
        setRefundMethod(r.refund_method ?? 'cash');
    };

    const closeDetail = () => setSelectedReturn(null);

    const handleApprove = async () => {
        if (!selectedReturn || processing) return;
        setProcessing(true);
        try {
            const updated = await approveReturn(selectedReturn.id, refundMethod);
            setReturns(prev => prev.map(r => (r.id === updated.id ? updated : r)));
            showToast('success', 'Đã duyệt phiếu trả hàng', `${updated.code} đã được duyệt, tồn kho đã được cộng lại.`);
            closeDetail();
        } catch {
            showToast('error', 'Lỗi', 'Không thể duyệt phiếu trả hàng. Vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedReturn || processing) return;
        setProcessing(true);
        try {
            const updated = await rejectReturn(selectedReturn.id);
            setReturns(prev => prev.map(r => (r.id === updated.id ? updated : r)));
            showToast('info', 'Đã từ chối phiếu trả hàng', `${updated.code} đã bị từ chối.`);
            closeDetail();
        } catch {
            showToast('error', 'Lỗi', 'Không thể từ chối phiếu trả hàng. Vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

    const openCreateModal = () => {
        setIsCreateOpen(true);
        setOrderSearch('');
        setSelectedOrder(null);
        setReturnQuantities({});
        setReason('');
    };

    const closeCreateModal = () => setIsCreateOpen(false);

    const handleSelectOrder = (order: ApiOrder) => {
        setSelectedOrder(order);
        setOrderSearch(`${order.code}`);
        setIsOrderDropdownOpen(false);
        setReturnQuantities({});
    };

    const hasAnyReturnableItem = selectedOrder ? selectedOrder.items.some(it => remainingQty(it) > 0) : false;
    const hasAnyQuantityEntered = Object.values(returnQuantities).some(v => Number(v) > 0);

    const handleCreateReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || creating) return;

        const items = selectedOrder.items
            .map(it => ({ order_item: it.id, quantity: Number(returnQuantities[it.id] || 0) }))
            .filter(it => it.quantity > 0);

        if (items.length === 0) {
            showToast('error', 'Lỗi', 'Chọn ít nhất 1 sản phẩm và số lượng cần trả.');
            return;
        }

        setCreating(true);
        try {
            const created = await createReturn({
                order: selectedOrder.id,
                reason: reason.trim() || null,
                items,
            });
            setReturns(prev => [created, ...prev]);
            showToast('success', 'Đã tạo phiếu trả hàng', `${created.code} đang chờ duyệt.`);
            closeCreateModal();
        } catch {
            showToast('error', 'Lỗi', 'Không thể tạo phiếu trả hàng. Kiểm tra lại số lượng và thử lại.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <section className="page active" id="page-returns" data-title="Trả hàng">
            <div className="page-head">
                <div>
                    <h1>Trả hàng &amp; hoàn tiền</h1>
                    <p className="page-sub">Tạo và xử lý các phiếu yêu cầu trả hàng từ khách.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={openCreateModal}>
                        <Plus size={18} /> Tạo phiếu trả hàng
                    </button>
                </div>
            </div>

            <div className="status-tabs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(st => {
                    const count = st === 'all' ? returns.length : returns.filter(r => r.status === st).length;
                    const label = st === 'all' ? 'Tất cả' : RETURN_STATUS[st].label;
                    return (
                        <button key={st} className={`status-tab ${statusFilter === st ? 'active' : ''}`} onClick={() => { setStatusFilter(st); setPage(1); }}>
                            {label} <span>{count}</span>
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
                            placeholder="Tìm theo mã phiếu, mã đơn hoặc tên khách…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Mã phiếu</th>
                                <th>Đơn hàng gốc</th>
                                <th>Khách hàng</th>
                                <th>Số tiền hoàn</th>
                                <th>Ngày tạo</th>
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
                                            <strong>Chưa có phiếu trả hàng nào</strong>
                                            <p>Bấm "Tạo phiếu trả hàng" để bắt đầu.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map(r => {
                                    const order = orderById.get(r.order);
                                    const c = order?.customer ? customerById.get(order.customer) : null;
                                    const s = RETURN_STATUS[r.status];
                                    return (
                                        <tr key={r.id}>
                                            <td data-label="Mã phiếu"><strong>{r.code}</strong></td>
                                            <td data-label="Đơn hàng gốc" className="cell-muted">{order?.code ?? '—'}</td>
                                            <td data-label="Khách hàng">{c?.name ?? 'Khách lẻ'}</td>
                                            <td data-label="Số tiền hoàn" className="cell-money">{fmtMoney(r.refund_amount)}</td>
                                            <td data-label="Ngày tạo" className="cell-muted">{fmtDate(r.created_at)}</td>
                                            <td data-label="Trạng thái"><span className={`badge badge--${s.tone}`}>{s.label}</span></td>
                                            <td data-label="" className="td-actions">
                                                <button className="icon-btn icon-btn--sm" title="Xem chi tiết" onClick={() => openDetail(r)}>
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
                        {totalItems > 0 ? `Hiển thị ${(page - 1) * per + 1}–${Math.min(page * per, totalItems)} trong ${totalItems} phiếu` : '0 phiếu'}
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

            {/* Modal chi tiết + duyệt/từ chối */}
            <Modal
                isOpen={!!selectedReturn}
                onClose={closeDetail}
                title={`Phiếu trả hàng ${selectedReturn?.code ?? ''}`}
                size="lg"
                footer={
                    selectedReturn?.status === 'pending' ? (
                        <>
                            <button className="btn btn--ghost" onClick={handleReject} disabled={processing}>Từ chối</button>
                            <button className="btn btn--primary" onClick={handleApprove} disabled={processing}>
                                {processing ? 'Đang xử lý…' : 'Duyệt & hoàn tiền'}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn--ghost" onClick={closeDetail}>Đóng</button>
                    )
                }
            >
                {selectedReturn && (() => {
                    const order = orderById.get(selectedReturn.order);
                    const c = order?.customer ? customerById.get(order.customer) : null;
                    const staff = selectedReturn.staff ? staffById.get(selectedReturn.staff) : null;
                    return (
                        <div>
                            <div className="order-meta">
                                <div className="order-meta__item">
                                    <small>Đơn hàng gốc</small>
                                    <strong>{order?.code ?? '—'}</strong>
                                    <span className="cell-sub">{c?.name ?? 'Khách lẻ'}</span>
                                </div>
                                <div className="order-meta__item">
                                    <small>Lý do trả</small>
                                    <strong>{selectedReturn.reason ?? '—'}</strong>
                                    <span className="cell-sub">Tạo lúc {fmtDate(selectedReturn.created_at)}{staff ? ` · NV: ${staff.full_name}` : ''}</span>
                                </div>
                            </div>

                            <div className="order-items">
                                {selectedReturn.items.map(it => {
                                    const orderItem = order?.items.find(oi => oi.id === it.order_item);
                                    return (
                                        <div className="order-item" key={it.id}>
                                            <div>
                                                <strong style={{ fontSize: 13.5 }}>{orderItem?.product_name ?? `Sản phẩm #${it.variant}`}</strong>
                                                <div className="order-item__qty">{orderItem?.variant_name ?? '—'} · SL trả: {it.quantity}</div>
                                            </div>
                                            <span className="order-item__price">{fmtMoney(it.line_total)}</span>
                                        </div>
                                    );
                                })}
                                <div className="order-total">
                                    <span>Tổng tiền hoàn</span>
                                    <span>{fmtMoney(selectedReturn.refund_amount)}</span>
                                </div>
                            </div>

                            {selectedReturn.status === 'pending' ? (
                                <label className="field">
                                    <span>Hình thức hoàn tiền</span>
                                    <select className="select select--full" value={refundMethod} onChange={e => setRefundMethod(e.target.value as RefundMethod)}>
                                        {Object.entries(REFUND_METHOD_LABELS).map(([k, label]) => (
                                            <option key={k} value={k}>{label}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : (
                                <div className="order-meta" style={{ marginTop: 12 }}>
                                    <div className="order-meta__item">
                                        <small>Hình thức hoàn tiền</small>
                                        <strong>{selectedReturn.refund_method ? REFUND_METHOD_LABELS[selectedReturn.refund_method] : '—'}</strong>
                                    </div>
                                    <div className="order-meta__item">
                                        <small>Thời điểm xử lý</small>
                                        <strong>{selectedReturn.processed_at ? fmtDate(selectedReturn.processed_at) : '—'}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            {/* Modal tạo phiếu trả hàng */}
            <Modal
                isOpen={isCreateOpen}
                onClose={closeCreateModal}
                title="Tạo phiếu trả hàng"
                size="lg"
                footer={
                    <>
                        <button className="btn btn--ghost" onClick={closeCreateModal}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleCreateReturn} disabled={!selectedOrder || !hasAnyQuantityEntered || creating}>
                            {creating ? 'Đang tạo…' : 'Tạo phiếu trả hàng'}
                        </button>
                    </>
                }
            >
                <form className="form" onSubmit={handleCreateReturn}>
                    <div className="dropdown" style={{ width: '100%' }}>
                        <label className="field">
                            <span>Đơn hàng gốc *</span>
                            <div className="search search--full">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm theo mã đơn hoặc tên khách (chỉ đơn đã hoàn thành)…"
                                    value={orderSearch}
                                    onChange={e => {
                                        setOrderSearch(e.target.value);
                                        setSelectedOrder(null);
                                        setIsOrderDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsOrderDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsOrderDropdownOpen(false), 200)}
                                />
                            </div>
                        </label>
                        {isOrderDropdownOpen && orderSearch && !selectedOrder && (
                            <div className="dropdown__panel" style={{ opacity: 1, pointerEvents: 'auto', display: 'block', position: 'relative' }}>
                                {orderSearchResults.length > 0 ? (
                                    orderSearchResults.map(o => {
                                        const c = o.customer ? customerById.get(o.customer) : null;
                                        return (
                                            <div key={o.id} className="dropdown__item" style={{ cursor: 'pointer' }} onClick={() => handleSelectOrder(o)}>
                                                <div style={{ lineHeight: 1.3 }}>
                                                    <strong>{o.code}</strong>
                                                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{c?.name ?? 'Khách lẻ'} · {fmtMoney(o.total)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: 10, fontSize: 12.5, color: 'var(--text-3)' }}>Không tìm thấy đơn hàng đã hoàn thành khớp từ khoá.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {selectedOrder && (
                        <>
                            {!hasAnyReturnableItem ? (
                                <div className="empty-state" style={{ padding: 20 }}>
                                    <strong>Đơn hàng này không còn sản phẩm nào có thể trả</strong>
                                    <p>Toàn bộ sản phẩm trong đơn đã được trả trước đó.</p>
                                </div>
                            ) : (
                                <div className="field">
                                    <span>Chọn sản phẩm và số lượng trả</span>
                                    <div className="variant-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {selectedOrder.items.map(it => {
                                            const remaining = remainingQty(it);
                                            return (
                                                <div key={it.id} className="variant-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8, opacity: remaining <= 0 ? 0.5 : 1 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <strong style={{ fontSize: 13.5 }}>{it.product_name}</strong>
                                                        <div className="cell-sub">{it.variant_name ?? '—'} · Đã mua: {it.quantity} · Còn có thể trả: {Math.max(0, remaining)}</div>
                                                    </div>
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        min={0}
                                                        max={Math.max(0, remaining)}
                                                        disabled={remaining <= 0}
                                                        value={returnQuantities[it.id] ?? ''}
                                                        onChange={e => setReturnQuantities(prev => ({ ...prev, [it.id]: e.target.value }))}
                                                        placeholder="0"
                                                        style={{ width: 90 }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <label className="field">
                                <span>Lý do trả hàng</span>
                                <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: Sản phẩm bị lỗi, không đúng mô tả…" />
                            </label>
                        </>
                    )}
                </form>
            </Modal>
        </section>
    );
}
