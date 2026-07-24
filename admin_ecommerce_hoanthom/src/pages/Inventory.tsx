import { useState, useEffect, useMemo } from 'react';
import { PackagePlus, Search, History } from 'lucide-react';
import { getCategories } from '../services/categories';
import { getProducts, type ApiProduct } from '../services/products';
import { getProductVariants, type ApiProductVariant } from '../services/productVariants';
import { getUsers, type ApiUser } from '../services/users';
import {
    getInventoryMovements,
    createInventoryMovement,
    type ApiInventoryMovement,
    type MovementType,
} from '../services/inventory';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

const VARIANT_STATUS: Record<string, { label: string; tone: string }> = {
    active: { label: 'Đủ hàng', tone: 'success' },
    low: { label: 'Sắp hết', tone: 'warning' },
    out: { label: 'Hết hàng', tone: 'danger' },
    hidden: { label: 'Đang ẩn', tone: 'neutral' },
};

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
    purchase: 'Nhập hàng',
    adjustment: 'Điều chỉnh',
    return: 'Trả hàng',
    sale: 'Bán hàng',
};

const variantLabel = (v: ApiProductVariant) => v.variant_name || [v.size, v.color].filter(Boolean).join(' / ') || v.sku;

interface VariantRow {
    id: number;
    productName: string;
    categoryName: string;
    variantName: string;
    sku: string;
    stock: number;
    lowStockThreshold: number;
    status: string;
}

export function Inventory() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
    const [apiVariants, setApiVariants] = useState<ApiProductVariant[]>([]);
    const [movements, setMovements] = useState<ApiInventoryMovement[]>([]);
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [restockVariant, setRestockVariant] = useState<VariantRow | 'pick' | null>(null);
    const [formVariantId, setFormVariantId] = useState<number>(0);
    const [formType, setFormType] = useState<MovementType>('purchase');
    const [formQuantity, setFormQuantity] = useState('');
    const [formNote, setFormNote] = useState('');
    const [saving, setSaving] = useState(false);

    const loadAll = () => {
        return Promise.all([getCategories(), getProducts(), getProductVariants(), getInventoryMovements(), getUsers()])
            .then(([cats, prods, variants, moves, usersData]) => {
                setCategories(cats);
                setApiProducts(prods);
                setApiVariants(variants);
                setMovements(moves);
                setUsers(usersData);
            });
    };

    useEffect(() => {
        loadAll()
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải dữ liệu kho hàng từ máy chủ.'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showToast]);

    const productById = useMemo(() => new Map(apiProducts.map(p => [p.id, p])), [apiProducts]);
    const categoryNameById = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const userById = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const rows: VariantRow[] = useMemo(() => {
        return apiVariants.map(v => {
            const product = productById.get(v.product);
            return {
                id: v.id,
                productName: product?.name ?? '—',
                categoryName: product ? (categoryNameById.get(product.category) ?? '—') : '—',
                variantName: variantLabel(v),
                sku: v.sku,
                stock: v.stock,
                lowStockThreshold: v.low_stock_threshold,
                status: v.variant_status,
            };
        });
    }, [apiVariants, productById, categoryNameById]);

    const filteredRows = useMemo(() => {
        const q = search.toLowerCase();
        return rows
            .filter(r =>
                (r.productName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.variantName.toLowerCase().includes(q)) &&
                (statusFilter === 'all' || r.status === statusFilter)
            )
            .sort((a, b) => a.stock - b.stock);
    }, [rows, search, statusFilter]);

    const recentMovements = useMemo(() => movements.slice(0, 20), [movements]);

    const variantMeta = (variantId: number) => {
        const v = apiVariants.find(x => x.id === variantId);
        if (!v) return { name: '—', sku: '—' };
        const product = productById.get(v.product);
        return { name: `${product?.name ?? '—'} — ${variantLabel(v)}`, sku: v.sku };
    };

    const openRestockModal = (row: VariantRow | 'pick') => {
        setRestockVariant(row);
        setFormVariantId(row === 'pick' ? (apiVariants[0]?.id ?? 0) : row.id);
        setFormType('purchase');
        setFormQuantity('');
        setFormNote('');
    };

    const closeRestockModal = () => setRestockVariant(null);

    const handleSubmitMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = Number(formQuantity);
        if (!formVariantId || !qty || saving) return;
        if (formType === 'purchase' && qty <= 0) {
            showToast('error', 'Lỗi', 'Số lượng nhập hàng phải lớn hơn 0.');
            return;
        }

        setSaving(true);
        try {
            await createInventoryMovement({
                variant: formVariantId,
                movement_type: formType,
                quantity: formType === 'purchase' ? Math.abs(qty) : qty,
                note: formNote.trim() || null,
                staff: user?.id ?? null,
            });
            showToast('success', 'Đã ghi nhận', 'Tồn kho đã được cập nhật.');
            closeRestockModal();
            await loadAll();
        } catch {
            showToast('error', 'Lỗi', 'Không thể ghi nhận thay đổi kho. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="page active" id="page-inventory" data-title="Kho hàng">
            <div className="page-head">
                <div>
                    <h1>Kho hàng</h1>
                    <p className="page-sub">Theo dõi tồn kho theo biến thể và ghi nhận nhập hàng khi hết.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={() => openRestockModal('pick')} disabled={apiVariants.length === 0}>
                        <PackagePlus size={18} /> Ghi nhận nhập kho
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="toolbar">
                    <div className="search search--table">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên sản phẩm hoặc SKU…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="toolbar__filters">
                        <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">Mọi trạng thái</option>
                            <option value="active">Đủ hàng</option>
                            <option value="low">Sắp hết</option>
                            <option value="out">Hết hàng</option>
                            <option value="hidden">Đang ẩn</option>
                        </select>
                    </div>
                </div>

                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Danh mục</th>
                                <th>SKU</th>
                                <th>Tồn kho</th>
                                <th>Ngưỡng cảnh báo</th>
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
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <strong>Không tìm thấy biến thể nào</strong>
                                            <p>Thử đổi từ khoá hoặc bộ lọc.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map(r => {
                                    const s = VARIANT_STATUS[r.status] ?? VARIANT_STATUS.active;
                                    return (
                                        <tr key={r.id}>
                                            <td data-label="Sản phẩm">
                                                <strong>{r.productName}</strong>
                                                <small style={{ display: 'block', color: 'var(--text-3)' }}>{r.variantName}</small>
                                            </td>
                                            <td data-label="Danh mục"><span className="badge badge--primary">{r.categoryName}</span></td>
                                            <td data-label="SKU" className="cell-muted">{r.sku}</td>
                                            <td data-label="Tồn kho" style={{ fontWeight: 600 }}>{r.stock}</td>
                                            <td data-label="Ngưỡng cảnh báo" className="cell-muted">{r.lowStockThreshold}</td>
                                            <td data-label="Trạng thái"><span className={`badge badge--${s.tone}`}>{s.label}</span></td>
                                            <td data-label="" className="td-actions">
                                                <button className="btn btn--sm btn--ghost" onClick={() => openRestockModal(r)}>
                                                    <PackagePlus size={14} /> Nhập hàng
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
                <div className="page-head" style={{ padding: '16px 20px 0' }}>
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><History size={18} /> Lịch sử nhập/xuất gần đây</h3>
                    </div>
                </div>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Sản phẩm</th>
                                <th>Loại</th>
                                <th>Số lượng</th>
                                <th>Tồn sau</th>
                                <th>Nhân viên</th>
                                <th>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <strong>Chưa có lịch sử</strong>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recentMovements.map(m => {
                                    const meta = variantMeta(m.variant);
                                    const staffName = m.staff ? (userById.get(m.staff)?.full_name ?? '—') : '—';
                                    return (
                                        <tr key={m.id}>
                                            <td data-label="Thời gian" className="cell-muted">
                                                {new Date(m.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td data-label="Sản phẩm">
                                                <strong>{meta.name}</strong>
                                                <small style={{ display: 'block', color: 'var(--text-3)' }}>{meta.sku}</small>
                                            </td>
                                            <td data-label="Loại">{MOVEMENT_TYPE_LABELS[m.movement_type]}</td>
                                            <td data-label="Số lượng" style={{ fontWeight: 600, color: m.quantity < 0 ? 'var(--danger)' : 'var(--success)' }}>
                                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                            </td>
                                            <td data-label="Tồn sau">{m.stock_after}</td>
                                            <td data-label="Nhân viên" className="cell-muted">{staffName}</td>
                                            <td data-label="Ghi chú" className="cell-muted">{m.note ?? '—'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={restockVariant !== null}
                onClose={closeRestockModal}
                title="Ghi nhận thay đổi kho"
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn--ghost" onClick={closeRestockModal}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleSubmitMovement} disabled={saving}>
                            {saving ? 'Đang lưu…' : 'Xác nhận'}
                        </button>
                    </div>
                }
            >
                <form className="form" onSubmit={handleSubmitMovement}>
                    <label className="field">
                        <span>Sản phẩm / biến thể *</span>
                        <select
                            className="select select--full"
                            value={formVariantId}
                            disabled={restockVariant !== 'pick'}
                            onChange={e => setFormVariantId(Number(e.target.value))}
                        >
                            {apiVariants.map(v => {
                                const product = productById.get(v.product);
                                return (
                                    <option key={v.id} value={v.id}>
                                        {product?.name ?? '—'} — {variantLabel(v)} ({v.sku}) · Tồn: {v.stock}
                                    </option>
                                );
                            })}
                        </select>
                    </label>
                    <div className="form-row">
                        <label className="field">
                            <span>Loại *</span>
                            <select className="select select--full" value={formType} onChange={e => setFormType(e.target.value as MovementType)}>
                                <option value="purchase">Nhập hàng</option>
                                <option value="adjustment">Điều chỉnh kho (kiểm kê)</option>
                                <option value="return">Trả hàng (khách trả lại)</option>
                            </select>
                        </label>
                        <label className="field">
                            <span>{formType === 'adjustment' ? 'Số lượng thay đổi (+/-) *' : 'Số lượng *'}</span>
                            <input
                                className="input"
                                type="number"
                                required
                                value={formQuantity}
                                onChange={e => setFormQuantity(e.target.value)}
                                placeholder={formType === 'adjustment' ? 'VD: -3 hoặc 5' : 'VD: 20'}
                            />
                        </label>
                    </div>
                    <label className="field">
                        <span>Ghi chú</span>
                        <input className="input" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="VD: Nhập từ nhà cung cấp X" />
                    </label>
                </form>
            </Modal>
        </section>
    );
}
