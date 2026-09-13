import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ChevronsUpDown, ChevronUp, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight, X, Star, Barcode as BarcodeIcon } from 'lucide-react';
import { PrintBarcodesModal } from './products/PrintBarcodesModal';
import type { Product, Category, Supplier } from '../types';
import { getCategories } from '../services/categories';
import { getSuppliers } from '../services/suppliers';
import { getProducts, createProduct, updateProduct, deleteProduct, type ApiProduct, type ProductPayload } from '../services/products';
import {
    getProductVariants,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant,
    type ApiProductVariant,
    type ProductVariantPayload,
} from '../services/productVariants';
import {
    getProductImages,
    uploadImageFile,
    createProductImage,
    updateProductImage,
    deleteProductImage,
    type ApiProductImage,
} from '../services/productImages';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

const PRODUCT_STATUS: Record<string, { label: string, tone: string }> = {
    active: { label: "Đang bán", tone: "success" },
    low: { label: "Sắp hết", tone: "warning" },
    out: { label: "Hết hàng", tone: "danger" },
    hidden: { label: "Đang ẩn", tone: "neutral" },
};

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

type VariantRow = { id?: number; sku: string; label: string; price: string; stock: number };
type PendingImage = { key: string; file: File; previewUrl: string };

const variantLabel = (v: ApiProductVariant) => v.variant_name || [v.size, v.color].filter(Boolean).join(' / ') || v.sku;
const existingImageKey = (id: number) => `existing-${id}`;

export function Products() {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [status, setStatus] = useState('all');
    const [sortKey, setSortKey] = useState<keyof Product>('sold');
    const [sortDir, setSortDir] = useState<-1 | 1>(-1);
    const [page, setPage] = useState(1);
    const per = 10;

    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
    const [apiVariants, setApiVariants] = useState<ApiProductVariant[]>([]);
    const [apiImages, setApiImages] = useState<ApiProductImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isPrintBarcodesOpen, setIsPrintBarcodesOpen] = useState(false);

    const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
    const [editingVariants, setEditingVariants] = useState<VariantRow[]>([]);
    const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);
    const [formCategoryId, setFormCategoryId] = useState<number>(0);
    const [formSupplierId, setFormSupplierId] = useState<number>(0);
    const [formName, setFormName] = useState('');
    const [formHidden, setFormHidden] = useState(false);

    const [existingImages, setExistingImages] = useState<ApiProductImage[]>([]);
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
    const [primaryImageKey, setPrimaryImageKey] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getCategories(), getSuppliers(), getProducts(), getProductVariants(), getProductImages()])
            .then(([cats, sups, prods, variants, images]) => {
                setCategories(cats);
                setSuppliers(sups);
                setApiProducts(prods);
                setApiVariants(variants);
                setApiImages(images);
            })
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải danh sách sản phẩm từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const products: Product[] = useMemo(() => {
        const categoryNameById = new Map(categories.map(c => [c.id, c.name]));
        return apiProducts.map(p => {
            const variants = apiVariants.filter(v => v.product === p.id);
            const prices = variants.map(v => v.price);
            const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
            const derivedStatus: Product['status'] = !p.is_active
                ? 'hidden'
                : totalStock === 0
                    ? 'out'
                    : variants.some(v => v.variant_status === 'low')
                        ? 'low'
                        : 'active';

            return {
                id: p.id,
                name: p.name,
                sku: variants[0]?.sku ?? '—',
                category: categoryNameById.get(p.category) ?? '—',
                price: prices.length ? Math.min(...prices) : 0,
                stock: totalStock,
                sold: 0,
                status: derivedStatus,
                emoji: '📦',
                tint: '#e5e7eb',
                variants: variants.map(v => ({ label: variantLabel(v), stock: v.stock })),
            };
        });
    }, [apiProducts, apiVariants, categories]);

    const openModal = (p: Product | 'new') => {
        setEditingProduct(p);
        setDeletedVariantIds([]);
        setDeletedImageIds([]);
        setPendingImages([]);
        if (p === 'new') {
            setFormCategoryId(categories[0]?.id ?? 0);
            setFormSupplierId(0);
            setFormName('');
            setFormHidden(false);
            setEditingVariants([{ sku: '', label: '', price: '', stock: 0 }]);
            setExistingImages([]);
            setPrimaryImageKey(null);
        } else {
            const apiProduct = apiProducts.find(ap => ap.id === p.id);
            if (!apiProduct) return;
            setFormCategoryId(apiProduct.category);
            setFormSupplierId(apiProduct.default_supplier ?? 0);
            setFormName(apiProduct.name);
            setFormHidden(!apiProduct.is_active);
            const rows = apiVariants
                .filter(v => v.product === p.id)
                .map(v => ({ id: v.id, sku: v.sku, label: variantLabel(v), price: String(v.price), stock: v.stock }));
            setEditingVariants(rows.length ? rows : [{ sku: '', label: '', price: '', stock: 0 }]);
            const imgs = apiImages.filter(img => img.product === p.id).sort((a, b) => a.sort_order - b.sort_order);
            setExistingImages(imgs);
            const primary = imgs.find(i => i.is_primary) ?? imgs[0];
            setPrimaryImageKey(primary ? existingImageKey(primary.id) : null);
        }
    };

    const closeModal = () => {
        pendingImages.forEach(p => URL.revokeObjectURL(p.previewUrl));
        setEditingProduct(null);
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const newPending: PendingImage[] = files.map(file => ({
            key: `pending-${Math.random().toString(36).slice(2)}`,
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setPendingImages(prev => [...prev, ...newPending]);
        setPrimaryImageKey(prev => prev ?? newPending[0]?.key ?? null);
        e.target.value = '';
    };

    const handleRemoveExistingImage = (id: number) => {
        setDeletedImageIds(prev => [...prev, id]);
        setExistingImages(prev => prev.filter(i => i.id !== id));
        setPrimaryImageKey(prev => (prev === existingImageKey(id) ? null : prev));
    };

    const handleRemovePendingImage = (key: string) => {
        setPendingImages(prev => {
            const target = prev.find(p => p.key === key);
            if (target) URL.revokeObjectURL(target.previewUrl);
            return prev.filter(p => p.key !== key);
        });
        setPrimaryImageKey(prev => (prev === key ? null : prev));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;
        if (!formName.trim() || !formCategoryId) {
            showToast('error', 'Thiếu thông tin', 'Vui lòng nhập Tên sản phẩm và chọn Danh mục trước khi lưu.');
            return;
        }

        const payload: ProductPayload = {
            category: formCategoryId,
            default_supplier: formSupplierId || null,
            name: formName.trim(),
            is_active: !formHidden,
        };

        setSaving(true);
        try {
            let productId: number;
            let savedProduct: ApiProduct;
            if (editingProduct === 'new') {
                savedProduct = await createProduct(payload);
                productId = savedProduct.id;
                setApiProducts(prev => [savedProduct, ...prev]);
            } else if (editingProduct) {
                savedProduct = await updateProduct(editingProduct.id, payload);
                productId = savedProduct.id;
                setApiProducts(prev => prev.map(p => (p.id === savedProduct.id ? savedProduct : p)));
            } else {
                return;
            }

            const savedVariants: ApiProductVariant[] = [];
            for (const row of editingVariants) {
                if (!row.sku.trim()) continue;
                const variantPayload: ProductVariantPayload = {
                    product: productId,
                    sku: row.sku.trim(),
                    variant_name: row.label.trim() || null,
                    price: Number(row.price) || 0,
                };
                const saved = row.id
                    ? await updateProductVariant(row.id, variantPayload)
                    : await createProductVariant(variantPayload);
                savedVariants.push(saved);
            }
            for (const id of deletedVariantIds) {
                await deleteProductVariant(id);
            }

            setApiVariants(prev => [...prev.filter(v => v.product !== productId), ...savedVariants]);

            for (const id of deletedImageIds) {
                await deleteProductImage(id);
            }

            const finalExistingImages: ApiProductImage[] = [];
            for (const img of existingImages) {
                const shouldBePrimary = primaryImageKey === existingImageKey(img.id);
                finalExistingImages.push(
                    shouldBePrimary === img.is_primary ? img : await updateProductImage(img.id, { is_primary: shouldBePrimary })
                );
            }

            const newlyCreatedImages: ApiProductImage[] = [];
            for (const pending of pendingImages) {
                const uploaded = await uploadImageFile(pending.file);
                const created = await createProductImage({
                    product: productId,
                    image_url: uploaded.image_url,
                    thumbnail_url: uploaded.thumbnail_url,
                    file_size: uploaded.file_size,
                    width: uploaded.width,
                    height: uploaded.height,
                    is_primary: primaryImageKey === pending.key,
                });
                newlyCreatedImages.push(created);
                URL.revokeObjectURL(pending.previewUrl);
            }

            setApiImages(prev => [
                ...prev.filter(img => img.product !== productId),
                ...finalExistingImages,
                ...newlyCreatedImages,
            ]);

            showToast('success', editingProduct === 'new' ? 'Đã thêm sản phẩm' : 'Đã lưu thay đổi', 'Thông tin sản phẩm đã được cập nhật.');
            setEditingProduct(null);
        } catch {
            showToast('error', 'Lỗi', 'Không thể lưu sản phẩm. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (p: Product) => {
        if (!window.confirm(`Xóa sản phẩm ${p.name}?`)) return;
        try {
            await deleteProduct(p.id);
            setApiProducts(prev => prev.filter(x => x.id !== p.id));
            showToast('success', 'Đã xóa sản phẩm', `${p.name} đã được xóa khỏi hệ thống.`);
        } catch {
            showToast('error', 'Lỗi', 'Không thể xóa sản phẩm. Vui lòng thử lại.');
        }
    };

    const filteredProducts = useMemo(() => {
        let rows = products.filter((p) => {
            const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
            const matchCat = category === 'all' || p.category === category;
            const matchStatus = status === 'all' || p.status === status;
            return matchSearch && matchCat && matchStatus;
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
    }, [products, search, category, status, sortKey, sortDir]);

    const totalItems = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / per));
    const currentRows = filteredProducts.slice((page - 1) * per, page * per);

    const handleSort = (key: keyof Product) => {
        if (sortKey === key) {
            setSortDir(prev => (prev === 1 ? -1 : 1));
        } else {
            setSortKey(key);
            setSortDir(1);
        }
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof Product }) => {
        if (sortKey !== columnKey) return <ChevronsUpDown size={14} />;
        return sortDir === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    return (
        <section className="page active" id="page-products" data-title="Sản phẩm">
            <div className="page-head">
                <div>
                    <h1>Sản phẩm</h1>
                    <p className="page-sub">Quản lý kho hàng, danh mục và biến thể.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--ghost" onClick={() => setIsPrintBarcodesOpen(true)} disabled={apiVariants.length === 0}>
                        <BarcodeIcon size={18} /> In mã vạch
                    </button>
                    <button className="btn btn--primary" onClick={() => openModal('new')} disabled={categories.length === 0}>
                        <Plus size={18} /> Thêm sản phẩm
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="toolbar">
                    <div className="search search--table">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc SKU…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="toolbar__filters">
                        <select className="select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
                            <option value="all">Tất cả danh mục</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select className="select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                            <option value="all">Mọi trạng thái</option>
                            <option value="active">Đang bán</option>
                            <option value="low">Sắp hết hàng</option>
                            <option value="out">Hết hàng</option>
                            <option value="hidden">Đang ẩn</option>
                        </select>
                    </div>
                </div>

                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="sortable" onClick={() => handleSort('name')}>Sản phẩm <SortIcon columnKey="name" /></th>
                                <th>Danh mục</th>
                                <th>Nhà cung cấp</th>
                                <th className="sortable" onClick={() => handleSort('price')}>Giá <SortIcon columnKey="price" /></th>
                                <th className="sortable" onClick={() => handleSort('stock')}>Tồn kho <SortIcon columnKey="stock" /></th>
                                <th className="sortable" onClick={() => handleSort('sold')}>Đã bán <SortIcon columnKey="sold" /></th>
                                <th>Trạng thái</th>
                                <th className="th-actions">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="empty-state">
                                            <strong>Đang tải…</strong>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="empty-state">
                                            <strong>Không tìm thấy sản phẩm</strong>
                                            <p>Thử đổi từ khoá hoặc xoá bớt bộ lọc để xem thêm kết quả.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map(p => {
                                    const s = PRODUCT_STATUS[p.status];
                                    const stockPct = Math.min(100, Math.round((p.stock / 120) * 100));
                                    const stockColor = p.stock === 0 ? "var(--danger)" : p.stock <= 15 ? "var(--warning)" : "var(--success)";
                                    const productImages = apiImages.filter(img => img.product === p.id);
                                    const thumb = productImages.find(img => img.is_primary) ?? productImages[0];
                                    const apiProduct = apiProducts.find(ap => ap.id === p.id);
                                    const supplierName = apiProduct?.default_supplier
                                        ? (suppliers.find(s => s.id === apiProduct.default_supplier)?.name ?? '—')
                                        : null;
                                    return (
                                        <tr key={p.id}>
                                            <td data-label="Sản phẩm">
                                                <div className="cell-product">
                                                    <div className="cell-product__thumb" style={{ background: p.tint, overflow: 'hidden', padding: 0 }}>
                                                        {thumb ? (
                                                            <img src={thumb.thumbnail_url ?? thumb.image_url} alt={thumb.alt_text ?? p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : p.emoji}
                                                    </div>
                                                    <div>
                                                        <strong>{p.name}</strong>
                                                        <small>SKU: {p.sku} · {p.variants.length} biến thể</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Danh mục"><span className="badge badge--primary">{p.category}</span></td>
                                            <td data-label="Nhà cung cấp" className="cell-muted">{supplierName ?? '— Chưa xác định —'}</td>
                                            <td data-label="Giá" className="cell-money">{fmtMoney(p.price)}</td>
                                            <td data-label="Tồn kho" className="stock-cell">
                                                <span style={{ fontWeight: 600 }}>{p.stock}</span>
                                                <div className="stock-bar">
                                                    <span style={{ width: `${stockPct}%`, background: stockColor }}></span>
                                                </div>
                                            </td>
                                            <td data-label="Đã bán" className="cell-muted">{p.sold}</td>
                                            <td data-label="Trạng thái"><span className={`badge badge--${s.tone}`}>{s.label}</span></td>
                                            <td data-label="" className="td-actions">
                                                <button className="icon-btn icon-btn--sm" title="Sửa" onClick={() => openModal(p)}><Pencil size={16} /></button>
                                                <button className="icon-btn icon-btn--sm" title="Xóa" onClick={() => handleDelete(p)}><Trash2 size={16} /></button>
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
                        {totalItems > 0 ? `Hiển thị ${(page - 1) * per + 1}–${Math.min(page * per, totalItems)} trong ${totalItems} sản phẩm` : "0 sản phẩm"}
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
                isOpen={editingProduct !== null}
                onClose={closeModal}
                title={editingProduct === 'new' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
                size="lg"
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn--ghost" onClick={closeModal}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Đang lưu…' : editingProduct === 'new' ? 'Thêm sản phẩm' : 'Lưu thay đổi'}
                        </button>
                    </div>
                }
            >
                <form className="form" onSubmit={handleSave}>
                    <div className="form-row">
                        <label className="field">
                            <span>Tên sản phẩm <em className="required-mark">*</em></span>
                            <input className="input" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="VD: Áo hoodie oversize" />
                        </label>
                        <label className="field">
                            <span>Danh mục <em className="required-mark">*</em></span>
                            <select className="select select--full" value={formCategoryId} onChange={e => setFormCategoryId(Number(e.target.value))}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="form-row">
                        <label className="field">
                            <span>Nhà cung cấp</span>
                            <select className="select select--full" value={formSupplierId} onChange={e => setFormSupplierId(Number(e.target.value))}>
                                <option value={0}>— Chưa xác định —</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="field">
                        <span>Ảnh sản phẩm</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {existingImages.map(img => {
                                const key = existingImageKey(img.id);
                                const isPrimary = primaryImageKey === key;
                                return (
                                    <div key={key} style={{ position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: isPrimary ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                                        <img src={img.thumbnail_url ?? img.image_url} alt={img.alt_text ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button type="button" onClick={() => setPrimaryImageKey(key)} title="Đặt làm ảnh đại diện" style={{ position: 'absolute', top: 2, left: 2, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: 2, cursor: 'pointer', lineHeight: 0 }}>
                                            <Star size={14} color="var(--primary)" fill={isPrimary ? 'var(--primary)' : 'none'} />
                                        </button>
                                        <button type="button" onClick={() => handleRemoveExistingImage(img.id)} title="Xóa ảnh" style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: 2, cursor: 'pointer', lineHeight: 0 }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            {pendingImages.map(pImg => {
                                const isPrimary = primaryImageKey === pImg.key;
                                return (
                                    <div key={pImg.key} style={{ position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: isPrimary ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                                        <img src={pImg.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button type="button" onClick={() => setPrimaryImageKey(pImg.key)} title="Đặt làm ảnh đại diện" style={{ position: 'absolute', top: 2, left: 2, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: 2, cursor: 'pointer', lineHeight: 0 }}>
                                            <Star size={14} color="var(--primary)" fill={isPrimary ? 'var(--primary)' : 'none'} />
                                        </button>
                                        <button type="button" onClick={() => handleRemovePendingImage(pImg.key)} title="Xóa ảnh" style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: 2, cursor: 'pointer', lineHeight: 0 }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            <label style={{ width: 90, height: 90, borderRadius: 8, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)' }}>
                                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFilesSelected} style={{ display: 'none' }} />
                                <Plus size={20} />
                            </label>
                        </div>
                        <p className="cell-muted" style={{ fontSize: 12, marginTop: 6 }}>
                            Bấm biểu tượng ngôi sao để chọn ảnh đại diện. Ảnh mới sẽ được tải lên khi bấm Lưu.
                        </p>
                    </div>
                    <div className="field">
                        <span>Biến thể (SKU, tên, giá bán)</span>
                        <div className="variant-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {editingVariants.map((v, idx) => (
                                <div key={idx} className="variant-row" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            className="input"
                                            placeholder="Tên biến thể, vd: M / Đen"
                                            value={v.label}
                                            onChange={e => {
                                                const newVars = [...editingVariants];
                                                newVars[idx] = { ...newVars[idx], label: e.target.value };
                                                setEditingVariants(newVars);
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            className="input"
                                            placeholder="SKU"
                                            required
                                            value={v.sku}
                                            onChange={e => {
                                                const newVars = [...editingVariants];
                                                newVars[idx] = { ...newVars[idx], sku: e.target.value };
                                                setEditingVariants(newVars);
                                            }}
                                            style={{ width: 160 }}
                                        />
                                        <button
                                            type="button"
                                            className="icon-btn icon-btn--sm"
                                            title="Xóa biến thể"
                                            onClick={() => {
                                                if (v.id) setDeletedVariantIds(prev => [...prev, v.id!]);
                                                setEditingVariants(editingVariants.filter((_, i) => i !== idx));
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input
                                            className="input"
                                            type="number"
                                            min="0"
                                            placeholder="Giá bán (₫)"
                                            required
                                            value={v.price}
                                            onChange={e => {
                                                const newVars = [...editingVariants];
                                                newVars[idx] = { ...newVars[idx], price: e.target.value };
                                                setEditingVariants(newVars);
                                            }}
                                            style={{ width: 160 }}
                                        />
                                        <span className="cell-muted" style={{ fontSize: 12 }}>
                                            Tồn kho: {v.stock} (tự động cập nhật qua nhập/bán hàng, không sửa trực tiếp)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            style={{ alignSelf: 'flex-start', marginTop: 8 }}
                            onClick={() => setEditingVariants([...editingVariants, { sku: '', label: '', price: '', stock: 0 }])}
                        >
                            <Plus size={16} /> Thêm biến thể
                        </button>
                    </div>
                    <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                        <input
                            type="checkbox"
                            checked={formHidden}
                            onChange={e => setFormHidden(e.target.checked)}
                            style={{ width: 15, height: 15, accentColor: 'var(--primary)' }}
                        />
                        <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>Ẩn sản phẩm khỏi cửa hàng</span>
                    </label>
                </form>
            </Modal>

            <PrintBarcodesModal
                isOpen={isPrintBarcodesOpen}
                onClose={() => setIsPrintBarcodesOpen(false)}
                apiProducts={apiProducts}
                apiVariants={apiVariants}
            />
        </section>
    );
}
