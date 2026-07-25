import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
    getSupplierReturns,
    createSupplierReturn,
    approveSupplierReturn,
    rejectSupplierReturn,
    type ApiSupplierReturn,
    type SupplierReturnStatus,
    type SupplierRefundMethod,
} from '../services/supplierReturns';
import { getSuppliers } from '../services/suppliers';
import { getProducts, type ApiProduct } from '../services/products';
import { getProductVariants, type ApiProductVariant } from '../services/productVariants';
import { getUsers, type ApiUser } from '../services/users';
import type { Supplier } from '../types';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

const STATUS_LABELS: Record<SupplierReturnStatus, { label: string; tone: string }> = {
    pending: { label: 'Chờ duyệt', tone: 'warning' },
    approved: { label: 'Đã duyệt', tone: 'success' },
    rejected: { label: 'Đã từ chối', tone: 'danger' },
};

const REFUND_METHOD_LABELS: Record<SupplierRefundMethod, string> = {
    cash: 'Tiền mặt',
    transfer: 'Chuyển khoản',
    credit_note: 'Ghi nợ (trừ vào đơn nhập sau)',
};

const fmtMoney = (n: number) => n.toLocaleString('vi-VN') + '₫';
const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const variantLabel = (v: ApiProductVariant) => v.variant_name || [v.size, v.color].filter(Boolean).join(' / ') || v.sku;

interface CartLine {
    variantId: number;
    productName: string;
    variantName: string;
    sku: string;
    maxQty: number;
    quantity: string;
}

export function SupplierReturns() {
    const { showToast } = useToast();

    const [supplierReturns, setSupplierReturns] = useState<ApiSupplierReturn[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
    const [apiVariants, setApiVariants] = useState<ApiProductVariant[]>([]);
    const [staffUsers, setStaffUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const per = 10;

    const [selected, setSelected] = useState<ApiSupplierReturn | null>(null);
    const [refundMethod, setRefundMethod] = useState<SupplierRefundMethod>('cash');
    const [processing, setProcessing] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formSupplierId, setFormSupplierId] = useState<number>(0);
    const [variantSearch, setVariantSearch] = useState('');
    const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);
    const [cart, setCart] = useState<CartLine[]>([]);
    const [reason, setReason] = useState('');
    const [creating, setCreating] = useState(false);

    const loadAll = () => {
        return Promise.all([getSupplierReturns(), getSuppliers(), getProducts(), getProductVariants(), getUsers()])
            .then(([srData, supData, prodData, variantData, usersData]) => {
                setSupplierReturns(srData);
                setSuppliers(supData);
                setApiProducts(prodData);
                setApiVariants(variantData);
                setStaffUsers(usersData);
            });
    };

    useEffect(() => {
        loadAll()
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải dữ liệu trả hàng nhà cung cấp từ máy chủ.'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showToast]);

    const supplierById = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);
    const productById = useMemo(() => new Map(apiProducts.map(p => [p.id, p])), [apiProducts]);
    const variantById = useMemo(() => new Map(apiVariants.map(v => [v.id, v])), [apiVariants]);
    const staffById = useMemo(() => new Map(staffUsers.map(u => [u.id, u])), [staffUsers]);

    // Số lượng đang bị "giữ chỗ" bởi các phiếu khác đang chờ duyệt cho từng variant — dùng
    // để tính tồn kho còn có thể trả, khớp đúng rule cộng dồn ở backend.
    const reservedByVariant = useMemo(() => {
        const map = new Map<number, number>();
        for (const sr of supplierReturns) {
            if (sr.status !== 'pending') continue;
            for (const it of sr.items) {
                map.set(it.variant, (map.get(it.variant) ?? 0) + it.quantity);
            }
        }
        return map;
    }, [supplierReturns]);

    const remainingStock = (variant: ApiProductVariant) => variant.stock - (reservedByVariant.get(variant.id) ?? 0);

    const variantSearchResults = useMemo(() => {
        if (!variantSearch.trim()) return [];
        const q = variantSearch.toLowerCase().trim();
        const cartIds = new Set(cart.map(c => c.variantId));
        return apiVariants
            .filter(v => !cartIds.has(v.id) && remainingStock(v) > 0)
            .filter(v => {
                const product = productById.get(v.product);
                return v.sku.toLowerCase().includes(q) || (product?.name.toLowerCase() ?? '').includes(q) || variantLabel(v).toLowerCase().includes(q);
            })
            .slice(0, 8);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiVariants, variantSearch, cart, productById, reservedByVariant]);

    const filteredReturns = useMemo(() => {
        const q = search.toLowerCase();
        return supplierReturns.filter(sr => {
            const supplier = supplierById.get(sr.supplier);
            const matchSearch = sr.code.toLowerCase().includes(q) || (supplier?.name.toLowerCase() ?? '').includes(q);
            const matchStatus = statusFilter === 'all' || sr.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [supplierReturns, search, statusFilter, supplierById]);

    const totalItems = filteredReturns.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / per));
    const currentRows = filteredReturns.slice((page - 1) * per, page * per);

    const openDetail = (sr: ApiSupplierReturn) => {
        setSelected(sr);
        setRefundMethod(sr.refund_method ?? 'cash');
    };
    const closeDetail = () => setSelected(null);

    const handleApprove = async () => {
        if (!selected || processing) return;
        setProcessing(true);
        try {
            const updated = await approveSupplierReturn(selected.id, refundMethod);
            setSupplierReturns(prev => prev.map(sr => (sr.id === updated.id ? updated : sr)));
            showToast('success', 'Đã duyệt phiếu trả hàng', `${updated.code} đã được duyệt, tồn kho đã được trừ.`);
            closeDetail();
        } catch {
            showToast('error', 'Lỗi', 'Không thể duyệt phiếu trả hàng. Vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selected || processing) return;
        setProcessing(true);
        try {
            const updated = await rejectSupplierReturn(selected.id);
            setSupplierReturns(prev => prev.map(sr => (sr.id === updated.id ? updated : sr)));
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
        setFormSupplierId(suppliers[0]?.id ?? 0);
        setVariantSearch('');
        setCart([]);
        setReason('');
    };
    const closeCreateModal = () => setIsCreateOpen(false);

    const handleAddVariant = (v: ApiProductVariant) => {
        const product = productById.get(v.product);
        setCart(prev => [...prev, {
            variantId: v.id,
            productName: product?.name ?? '—',
            variantName: variantLabel(v),
            sku: v.sku,
            maxQty: remainingStock(v),
            quantity: '1',
        }]);
        setVariantSearch('');
        setIsVariantDropdownOpen(false);
    };

    const handleRemoveCartLine = (variantId: number) => {
        setCart(prev => prev.filter(c => c.variantId !== variantId));
    };

    const handleCreateSupplierReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formSupplierId || cart.length === 0 || creating) return;

        const items = cart
            .map(c => ({ variant: c.variantId, quantity: Number(c.quantity || 0) }))
            .filter(it => it.quantity > 0);

        if (items.length === 0) {
            showToast('error', 'Lỗi', 'Nhập số lượng hợp lệ cho ít nhất 1 sản phẩm.');
            return;
        }

        setCreating(true);
        try {
            const created = await createSupplierReturn({
                supplier: formSupplierId,
                reason: reason.trim() || null,
                items,
            });
            setSupplierReturns(prev => [created, ...prev]);
            showToast('success', 'Đã tạo phiếu trả hàng', `${created.code} đang chờ duyệt.`);
            closeCreateModal();
        } catch {
            showToast('error', 'Lỗi', 'Không thể tạo phiếu trả hàng. Kiểm tra lại số lượng và thử lại.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <section className="page active" id="page-supplier-returns" data-title="Trả hàng NCC">
            <div className="page-head">
                <div>
                    <h1>Trả hàng cho nhà cung cấp</h1>
                    <p className="page-sub">Tạo và xử lý các phiếu trả hàng lỗi/dư về cho nhà cung cấp.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={openCreateModal} disabled={suppliers.length === 0}>
                        <Plus size={18} /> Tạo phiếu trả hàng NCC
                    </button>
                </div>
            </div>

            <div className="status-tabs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(st => {
                    const count = st === 'all' ? supplierReturns.length : supplierReturns.filter(r => r.status === st).length;
                    const label = st === 'all' ? 'Tất cả' : STATUS_LABELS[st].label;
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
                            placeholder="Tìm theo mã phiếu hoặc tên nhà cung cấp…"
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
                                <th>Nhà cung cấp</th>
                                <th>Số tiền hoàn</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
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
                                            <strong>Chưa có phiếu trả hàng NCC nào</strong>
                                            <p>Bấm "Tạo phiếu trả hàng NCC" để bắt đầu.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map(sr => {
                                    const supplier = supplierById.get(sr.supplier);
                                    const s = STATUS_LABELS[sr.status];
                                    return (
                                        <tr key={sr.id}>
                                            <td data-label="Mã phiếu"><strong>{sr.code}</strong></td>
                                            <td data-label="Nhà cung cấp">{supplier?.name ?? '—'}</td>
                                            <td data-label="Số tiền hoàn" className="cell-money">{fmtMoney(sr.refund_amount)}</td>
                                            <td data-label="Ngày tạo" className="cell-muted">{fmtDate(sr.created_at)}</td>
                                            <td data-label="Trạng thái"><span className={`badge badge--${s.tone}`}>{s.label}</span></td>
                                            <td data-label="" className="td-actions">
                                                <button className="icon-btn icon-btn--sm" title="Xem chi tiết" onClick={() => openDetail(sr)}>
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
                isOpen={!!selected}
                onClose={closeDetail}
                title={`Phiếu trả hàng NCC ${selected?.code ?? ''}`}
                size="lg"
                footer={
                    selected?.status === 'pending' ? (
                        <>
                            <button className="btn btn--ghost" onClick={handleReject} disabled={processing}>Từ chối</button>
                            <button className="btn btn--primary" onClick={handleApprove} disabled={processing}>
                                {processing ? 'Đang xử lý…' : 'Duyệt & trừ kho'}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn--ghost" onClick={closeDetail}>Đóng</button>
                    )
                }
            >
                {selected && (() => {
                    const supplier = supplierById.get(selected.supplier);
                    const staff = selected.staff ? staffById.get(selected.staff) : null;
                    return (
                        <div>
                            <div className="order-meta">
                                <div className="order-meta__item">
                                    <small>Nhà cung cấp</small>
                                    <strong>{supplier?.name ?? '—'}</strong>
                                    <span className="cell-sub">{supplier?.phone ?? ''}</span>
                                </div>
                                <div className="order-meta__item">
                                    <small>Lý do trả</small>
                                    <strong>{selected.reason ?? '—'}</strong>
                                    <span className="cell-sub">Tạo lúc {fmtDate(selected.created_at)}{staff ? ` · NV: ${staff.full_name}` : ''}</span>
                                </div>
                            </div>

                            <div className="order-items">
                                {selected.items.map(it => {
                                    const v = variantById.get(it.variant);
                                    const product = v ? productById.get(v.product) : null;
                                    return (
                                        <div className="order-item" key={it.id}>
                                            <div>
                                                <strong style={{ fontSize: 13.5 }}>{product?.name ?? `Sản phẩm #${it.variant}`}</strong>
                                                <div className="order-item__qty">{v ? variantLabel(v) : '—'} · SL trả: {it.quantity}</div>
                                            </div>
                                            <span className="order-item__price">{fmtMoney(it.line_total)}</span>
                                        </div>
                                    );
                                })}
                                <div className="order-total">
                                    <span>Tổng tiền hoàn</span>
                                    <span>{fmtMoney(selected.refund_amount)}</span>
                                </div>
                            </div>

                            {selected.status === 'pending' ? (
                                <label className="field">
                                    <span>Hình thức hoàn tiền</span>
                                    <select className="select select--full" value={refundMethod} onChange={e => setRefundMethod(e.target.value as SupplierRefundMethod)}>
                                        {Object.entries(REFUND_METHOD_LABELS).map(([k, label]) => (
                                            <option key={k} value={k}>{label}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : (
                                <div className="order-meta" style={{ marginTop: 12 }}>
                                    <div className="order-meta__item">
                                        <small>Hình thức hoàn tiền</small>
                                        <strong>{selected.refund_method ? REFUND_METHOD_LABELS[selected.refund_method] : '—'}</strong>
                                    </div>
                                    <div className="order-meta__item">
                                        <small>Thời điểm xử lý</small>
                                        <strong>{selected.processed_at ? fmtDate(selected.processed_at) : '—'}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            {/* Modal tạo phiếu trả hàng NCC */}
            <Modal
                isOpen={isCreateOpen}
                onClose={closeCreateModal}
                title="Tạo phiếu trả hàng cho nhà cung cấp"
                size="lg"
                footer={
                    <>
                        <button className="btn btn--ghost" onClick={closeCreateModal}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleCreateSupplierReturn} disabled={!formSupplierId || cart.length === 0 || creating}>
                            {creating ? 'Đang tạo…' : 'Tạo phiếu trả hàng'}
                        </button>
                    </>
                }
            >
                <form className="form" onSubmit={handleCreateSupplierReturn}>
                    <label className="field">
                        <span>Nhà cung cấp *</span>
                        <select className="select select--full" value={formSupplierId} onChange={e => setFormSupplierId(Number(e.target.value))}>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </label>

                    <div className="dropdown" style={{ width: '100%' }}>
                        <label className="field">
                            <span>Thêm sản phẩm cần trả</span>
                            <div className="search search--full">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên sản phẩm hoặc SKU…"
                                    value={variantSearch}
                                    onChange={e => { setVariantSearch(e.target.value); setIsVariantDropdownOpen(true); }}
                                    onFocus={() => setIsVariantDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsVariantDropdownOpen(false), 200)}
                                />
                            </div>
                        </label>
                        {isVariantDropdownOpen && variantSearch && (
                            <div className="dropdown__panel" style={{ opacity: 1, pointerEvents: 'auto', display: 'block', position: 'relative' }}>
                                {variantSearchResults.length > 0 ? (
                                    variantSearchResults.map(v => {
                                        const product = productById.get(v.product);
                                        return (
                                            <div key={v.id} className="dropdown__item" style={{ cursor: 'pointer' }} onClick={() => handleAddVariant(v)}>
                                                <div style={{ lineHeight: 1.3 }}>
                                                    <strong>{product?.name ?? '—'} — {variantLabel(v)}</strong>
                                                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{v.sku} · Tồn có thể trả: {remainingStock(v)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: 10, fontSize: 12.5, color: 'var(--text-3)' }}>Không tìm thấy sản phẩm còn tồn kho khớp từ khoá.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="field">
                            <span>Sản phẩm sẽ trả</span>
                            <div className="variant-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {cart.map(line => (
                                    <div key={line.variantId} className="variant-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ fontSize: 13.5 }}>{line.productName}</strong>
                                            <div className="cell-sub">{line.variantName} · {line.sku} · Tồn có thể trả: {line.maxQty}</div>
                                        </div>
                                        <input
                                            className="input"
                                            type="number"
                                            min={1}
                                            max={line.maxQty}
                                            value={line.quantity}
                                            onChange={e => setCart(prev => prev.map(c => (c.variantId === line.variantId ? { ...c, quantity: e.target.value } : c)))}
                                            style={{ width: 80 }}
                                        />
                                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => handleRemoveCartLine(line.variantId)}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="field">
                        <span>Lý do trả hàng</span>
                        <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: Hàng lỗi từ nhà sản xuất, giao dư…" />
                    </label>
                </form>
            </Modal>
        </section>
    );
}
