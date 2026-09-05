import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, ChevronLeft, ChevronRight, X, FileText, Upload, Paperclip } from 'lucide-react';
import {
    getPurchaseInvoices,
    createPurchaseInvoice,
    uploadInvoiceFile,
    type ApiPurchaseInvoice,
} from '../services/purchases';
import { getSuppliers } from '../services/suppliers';
import { getProducts, type ApiProduct } from '../services/products';
import { getProductVariants, type ApiProductVariant } from '../services/productVariants';
import { getUsers, type ApiUser } from '../services/users';
import type { Supplier } from '../types';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

const fmtMoney = (n: number) => n.toLocaleString('vi-VN') + '₫';
const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const variantLabel = (v: ApiProductVariant) => v.variant_name || [v.size, v.color].filter(Boolean).join(' / ') || v.sku;
const isImageFile = (url: string) => /\.(jpe?g|png|webp)$/i.test(url);

interface CartLine {
    variantId: number;
    productName: string;
    variantName: string;
    sku: string;
    quantity: string;
    unitCost: string;
}

export function PurchaseInvoices() {
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState<ApiPurchaseInvoice[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
    const [apiVariants, setApiVariants] = useState<ApiProductVariant[]>([]);
    const [staffUsers, setStaffUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const per = 10;

    const [selected, setSelected] = useState<ApiPurchaseInvoice | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formSupplierId, setFormSupplierId] = useState<number>(0);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [note, setNote] = useState('');
    const [variantSearch, setVariantSearch] = useState('');
    const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);
    const [cart, setCart] = useState<CartLine[]>([]);
    const [invoiceFileUrl, setInvoiceFileUrl] = useState<string | null>(null);
    const [invoiceFileName, setInvoiceFileName] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [creating, setCreating] = useState(false);

    const loadAll = () => {
        return Promise.all([getPurchaseInvoices(), getSuppliers(), getProducts(), getProductVariants(), getUsers()])
            .then(([invoiceData, supData, prodData, variantData, usersData]) => {
                setInvoices(invoiceData);
                setSuppliers(supData);
                setApiProducts(prodData);
                setApiVariants(variantData);
                setStaffUsers(usersData);
            });
    };

    useEffect(() => {
        loadAll()
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải dữ liệu phiếu nhập hàng từ máy chủ.'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showToast]);

    const supplierById = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);
    const productById = useMemo(() => new Map(apiProducts.map(p => [p.id, p])), [apiProducts]);
    const variantById = useMemo(() => new Map(apiVariants.map(v => [v.id, v])), [apiVariants]);
    const staffById = useMemo(() => new Map(staffUsers.map(u => [u.id, u])), [staffUsers]);

    const openCreateModal = (presetVariantId?: number) => {
        setIsCreateOpen(true);
        setFormSupplierId(suppliers[0]?.id ?? 0);
        setInvoiceNumber('');
        setNote('');
        setVariantSearch('');
        setInvoiceFileUrl(null);
        setInvoiceFileName(null);
        if (presetVariantId) {
            const v = apiVariants.find(x => x.id === presetVariantId);
            if (v) {
                const product = productById.get(v.product);
                setCart([{
                    variantId: v.id,
                    productName: product?.name ?? '—',
                    variantName: variantLabel(v),
                    sku: v.sku,
                    quantity: '1',
                    unitCost: v.cost_price ? String(v.cost_price) : '',
                }]);
                return;
            }
        }
        setCart([]);
    };

    // Mở sẵn modal tạo phiếu nếu được điều hướng từ trang Kho hàng kèm biến thể cần nhập.
    useEffect(() => {
        const presetVariantId = (location.state as { presetVariantId?: number } | null)?.presetVariantId;
        if (presetVariantId && apiVariants.length > 0) {
            openCreateModal(presetVariantId);
            navigate(location.pathname, { replace: true, state: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiVariants]);

    const closeCreateModal = () => setIsCreateOpen(false);

    const variantSearchResults = useMemo(() => {
        if (!variantSearch.trim()) return [];
        const q = variantSearch.toLowerCase().trim();
        const cartIds = new Set(cart.map(c => c.variantId));
        return apiVariants
            .filter(v => !cartIds.has(v.id))
            .filter(v => {
                const product = productById.get(v.product);
                return v.sku.toLowerCase().includes(q) || (product?.name.toLowerCase() ?? '').includes(q) || variantLabel(v).toLowerCase().includes(q);
            })
            .slice(0, 8);
    }, [apiVariants, variantSearch, cart, productById]);

    const filteredInvoices = useMemo(() => {
        const q = search.toLowerCase();
        return invoices.filter(inv => {
            const supplier = supplierById.get(inv.supplier);
            return inv.code.toLowerCase().includes(q) ||
                (supplier?.name.toLowerCase() ?? '').includes(q) ||
                (inv.invoice_number?.toLowerCase() ?? '').includes(q);
        });
    }, [invoices, search, supplierById]);

    const totalItems = filteredInvoices.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / per));
    const currentRows = filteredInvoices.slice((page - 1) * per, page * per);

    const handleAddVariant = (v: ApiProductVariant) => {
        const product = productById.get(v.product);
        setCart(prev => [...prev, {
            variantId: v.id,
            productName: product?.name ?? '—',
            variantName: variantLabel(v),
            sku: v.sku,
            quantity: '1',
            unitCost: v.cost_price ? String(v.cost_price) : '',
        }]);
        setVariantSearch('');
        setIsVariantDropdownOpen(false);
    };

    const handleRemoveCartLine = (variantId: number) => {
        setCart(prev => prev.filter(c => c.variantId !== variantId));
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploadingFile(true);
        try {
            const uploaded = await uploadInvoiceFile(file);
            setInvoiceFileUrl(uploaded.file_url);
            setInvoiceFileName(uploaded.file_name);
        } catch {
            showToast('error', 'Lỗi', 'Không thể tải lên file hóa đơn. Vui lòng thử lại.');
        } finally {
            setUploadingFile(false);
        }
    };

    const cartTotal = cart.reduce((sum, c) => sum + (Number(c.quantity) || 0) * (Number(c.unitCost) || 0), 0);

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formSupplierId || cart.length === 0 || creating) return;

        const items = cart.map(c => ({
            variant: c.variantId,
            quantity: Number(c.quantity || 0),
            unit_cost: Number(c.unitCost || 0),
        }));

        if (items.some(it => it.quantity <= 0)) {
            showToast('error', 'Lỗi', 'Nhập số lượng hợp lệ (> 0) cho tất cả sản phẩm.');
            return;
        }

        setCreating(true);
        try {
            const created = await createPurchaseInvoice({
                supplier: formSupplierId,
                invoice_number: invoiceNumber.trim() || null,
                invoice_file: invoiceFileUrl,
                note: note.trim() || null,
                items,
            });
            setInvoices(prev => [created, ...prev]);
            showToast('success', 'Đã tạo phiếu nhập hàng', `${created.code} — tồn kho đã được cập nhật.`);
            closeCreateModal();
        } catch {
            showToast('error', 'Lỗi', 'Không thể tạo phiếu nhập hàng. Vui lòng thử lại.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <section className="page active" id="page-purchase-invoices" data-title="Nhập hàng">
            <div className="page-head">
                <div>
                    <h1>Phiếu nhập hàng</h1>
                    <p className="page-sub">Ghi nhận nhập hàng từ nhà cung cấp kèm hóa đơn.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={() => openCreateModal()} disabled={suppliers.length === 0}>
                        <Plus size={18} /> Tạo phiếu nhập hàng
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="toolbar">
                    <div className="search search--table">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo mã phiếu, số hóa đơn hoặc tên nhà cung cấp…"
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
                                <th>Số hóa đơn NCC</th>
                                <th>Tổng tiền</th>
                                <th>Ngày tạo</th>
                                <th>Hóa đơn</th>
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
                                            <strong>Chưa có phiếu nhập hàng nào</strong>
                                            <p>Bấm "Tạo phiếu nhập hàng" để bắt đầu.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map(inv => {
                                    const supplier = supplierById.get(inv.supplier);
                                    return (
                                        <tr key={inv.id}>
                                            <td data-label="Mã phiếu"><strong>{inv.code}</strong></td>
                                            <td data-label="Nhà cung cấp">{supplier?.name ?? '—'}</td>
                                            <td data-label="Số hóa đơn NCC" className="cell-muted">{inv.invoice_number ?? '—'}</td>
                                            <td data-label="Tổng tiền" className="cell-money">{fmtMoney(inv.total_amount)}</td>
                                            <td data-label="Ngày tạo" className="cell-muted">{fmtDate(inv.created_at)}</td>
                                            <td data-label="Hóa đơn">
                                                {inv.invoice_file ? (
                                                    <span className="badge badge--success"><Paperclip size={12} /> Có file</span>
                                                ) : (
                                                    <span className="badge badge--neutral">Không có</span>
                                                )}
                                            </td>
                                            <td data-label="" className="td-actions">
                                                <button className="icon-btn icon-btn--sm" title="Xem chi tiết" onClick={() => setSelected(inv)}>
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

            {/* Modal chi tiết */}
            <Modal
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                title={`Phiếu nhập hàng ${selected?.code ?? ''}`}
                size="lg"
                footer={<button className="btn btn--ghost" onClick={() => setSelected(null)}>Đóng</button>}
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
                                    <span className="cell-sub">{selected.invoice_number ? `Số HĐ: ${selected.invoice_number}` : 'Không có số hóa đơn'}</span>
                                </div>
                                <div className="order-meta__item">
                                    <small>Ghi chú</small>
                                    <strong>{selected.note ?? '—'}</strong>
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
                                                <div className="order-item__qty">{v ? variantLabel(v) : '—'} · SL: {it.quantity} × {fmtMoney(it.unit_cost)}</div>
                                            </div>
                                            <span className="order-item__price">{fmtMoney(it.line_total)}</span>
                                        </div>
                                    );
                                })}
                                <div className="order-total">
                                    <span>Tổng tiền nhập</span>
                                    <span>{fmtMoney(selected.total_amount)}</span>
                                </div>
                            </div>

                            {selected.invoice_file && (
                                <div className="field">
                                    <span>Hóa đơn đính kèm</span>
                                    {isImageFile(selected.invoice_file) ? (
                                        <a href={selected.invoice_file} target="_blank" rel="noreferrer">
                                            <img src={selected.invoice_file} alt="Hóa đơn" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid var(--border)' }} />
                                        </a>
                                    ) : (
                                        <a href={selected.invoice_file} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start' }}>
                                            <FileText size={16} /> Xem file hóa đơn
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            {/* Modal tạo phiếu nhập hàng */}
            <Modal
                isOpen={isCreateOpen}
                onClose={closeCreateModal}
                title="Tạo phiếu nhập hàng"
                size="lg"
                footer={
                    <>
                        <button className="btn btn--ghost" onClick={closeCreateModal}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleCreateInvoice} disabled={!formSupplierId || cart.length === 0 || creating}>
                            {creating ? 'Đang tạo…' : 'Tạo phiếu nhập hàng'}
                        </button>
                    </>
                }
            >
                <form className="form" onSubmit={handleCreateInvoice}>
                    <div className="form-row">
                        <label className="field">
                            <span>Nhà cung cấp *</span>
                            <select className="select select--full" value={formSupplierId} onChange={e => setFormSupplierId(Number(e.target.value))}>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Số hóa đơn NCC</span>
                            <input className="input" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="VD: HD-2026-0456" />
                        </label>
                    </div>

                    <div className="field">
                        <span>Hóa đơn đính kèm (ảnh hoặc PDF)</span>
                        {invoiceFileUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                {isImageFile(invoiceFileUrl) ? (
                                    <img src={invoiceFileUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                                ) : (
                                    <FileText size={32} />
                                )}
                                <span style={{ flex: 1, fontSize: 13 }}>{invoiceFileName}</span>
                                <button type="button" className="icon-btn icon-btn--sm" onClick={() => { setInvoiceFileUrl(null); setInvoiceFileName(null); }}>
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="btn btn--ghost" style={{ alignSelf: 'flex-start', cursor: 'pointer' }}>
                                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileSelected} style={{ display: 'none' }} disabled={uploadingFile} />
                                <Upload size={16} /> {uploadingFile ? 'Đang tải lên…' : 'Chọn file hóa đơn'}
                            </label>
                        )}
                    </div>

                    <div className="dropdown" style={{ width: '100%' }}>
                        <label className="field">
                            <span>Thêm sản phẩm nhập</span>
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
                                                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{v.sku} · Tồn hiện tại: {v.stock}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: 10, fontSize: 12.5, color: 'var(--text-3)' }}>Không tìm thấy sản phẩm khớp từ khoá.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="field">
                            <span>Sản phẩm sẽ nhập</span>
                            <div className="variant-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {cart.map(line => (
                                    <div key={line.variantId} className="variant-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ fontSize: 13.5 }}>{line.productName}</strong>
                                            <div className="cell-sub">{line.variantName} · {line.sku}</div>
                                        </div>
                                        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 11, color: 'var(--text-3)' }}>
                                            SL
                                            <input
                                                className="input"
                                                type="number"
                                                min={1}
                                                value={line.quantity}
                                                onChange={e => setCart(prev => prev.map(c => (c.variantId === line.variantId ? { ...c, quantity: e.target.value } : c)))}
                                                style={{ width: 70 }}
                                            />
                                        </label>
                                        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 11, color: 'var(--text-3)' }}>
                                            Giá nhập
                                            <input
                                                className="input"
                                                type="number"
                                                min={0}
                                                value={line.unitCost}
                                                onChange={e => setCart(prev => prev.map(c => (c.variantId === line.variantId ? { ...c, unitCost: e.target.value } : c)))}
                                                style={{ width: 110 }}
                                            />
                                        </label>
                                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => handleRemoveCartLine(line.variantId)}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="cell-muted" style={{ fontSize: 12, marginTop: 6, textAlign: 'right' }}>
                                Tổng tiền nhập: <strong>{fmtMoney(cartTotal)}</strong>
                            </p>
                        </div>
                    )}

                    <label className="field">
                        <span>Ghi chú</span>
                        <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Nhập bổ sung hàng bán chạy…" />
                    </label>
                </form>
            </Modal>
        </section>
    );
}
