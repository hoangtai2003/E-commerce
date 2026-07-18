import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ChevronsUpDown, ChevronUp, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockProducts } from '../data/mock';
import type { Category } from '../types';
import { getCategories, createCategory, updateCategory, deleteCategory, type CategoryPayload } from '../services/categories';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

export function Categories() {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<keyof Category>('name');
    const [sortDir, setSortDir] = useState<-1 | 1>(1);
    const [page, setPage] = useState(1);
    const per = 10;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);

    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formHidden, setFormHidden] = useState(false);

    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải danh sách danh mục từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const openModal = (c: Category | 'new') => {
        setEditingCategory(c);
        if (c === 'new') {
            setFormName('');
            setFormDesc('');
            setFormHidden(false);
        } else {
            setFormName(c.name);
            setFormDesc(c.description ?? '');
            setFormHidden(c.status === 'hidden');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || saving) return;

        const payload: CategoryPayload = {
            name: formName.trim(),
            description: formDesc.trim(),
            status: formHidden ? 'hidden' : 'active',
        };

        setSaving(true);
        try {
            if (editingCategory === 'new') {
                const created = await createCategory(payload);
                setCategories(prev => [created, ...prev]);
                showToast('success', 'Đã thêm danh mục', 'Danh mục mới đã được tạo.');
            } else if (editingCategory) {
                const updated = await updateCategory(editingCategory.id, payload);
                setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
                showToast('success', 'Đã lưu thay đổi', 'Thông tin danh mục đã được cập nhật.');
            }
            setEditingCategory(null);
        } catch {
            showToast('error', 'Lỗi', 'Không thể lưu danh mục. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (c: Category) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục ${c.name}?`)) return;
        try {
            await deleteCategory(c.id);
            setCategories(prev => prev.filter(x => x.id !== c.id));
            showToast('success', 'Đã xóa danh mục', `${c.name} đã được xóa khỏi hệ thống.`);
        } catch {
            showToast('error', 'Lỗi', 'Không thể xóa danh mục. Vui lòng thử lại.');
        }
    };

    const filteredCategories = useMemo(() => {
        const rows = categories.filter((c) => {
            const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.description ?? '').toLowerCase().includes(search.toLowerCase());
            return matchSearch;
        });

        rows.sort((a, b) => {
            const va = a[sortKey];
            const vb = b[sortKey];
            if (typeof va === 'string' && typeof vb === 'string') {
                return va.localeCompare(vb, "vi") * sortDir;
            }
            return 0;
        });

        return rows;
    }, [categories, search, sortKey, sortDir]);

    const totalItems = filteredCategories.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / per));
    const currentRows = filteredCategories.slice((page - 1) * per, page * per);

    const handleSort = (key: keyof Category) => {
        if (sortKey === key) {
            setSortDir(prev => (prev === 1 ? -1 : 1));
        } else {
            setSortKey(key);
            setSortDir(1);
        }
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof Category }) => {
        if (sortKey !== columnKey) return <ChevronsUpDown size={14} />;
        return sortDir === 1 ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    return (
        <section className="page active" id="page-categories" data-title="Danh mục">
            <div className="page-head">
                <div>
                    <h1>Danh mục hàng hóa</h1>
                    <p className="page-sub">Quản lý và phân loại các sản phẩm trong hệ thống.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={() => openModal('new')}>
                        <Plus size={18} /> Thêm danh mục
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="toolbar">
                    <div className="search search--table">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên danh mục…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="sortable" onClick={() => handleSort('name')} style={{ width: '25%' }}>Tên danh mục <SortIcon columnKey="name" /></th>
                                <th className="sortable" onClick={() => handleSort('description')} style={{ width: '40%' }}>Mô tả <SortIcon columnKey="description" /></th>
                                <th>Số sản phẩm</th>
                                <th className="sortable" onClick={() => handleSort('status')}>Trạng thái <SortIcon columnKey="status" /></th>
                                <th className="th-actions">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <strong>Đang tải…</strong>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentRows.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <strong>Không tìm thấy danh mục</strong>
                                            <p>Thử đổi từ khoá hoặc xoá bớt bộ lọc để xem thêm kết quả.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map(c => {
                                    const productCount = mockProducts.filter(p => p.category === c.name).length;
                                    const isActive = c.status === 'active';

                                    return (
                                        <tr key={c.id}>
                                            <td data-label="Tên danh mục">
                                                <strong>{c.name}</strong>
                                            </td>
                                            <td data-label="Mô tả" className="cell-muted" style={{ whiteSpace: 'normal', minWidth: '200px' }}>
                                                {c.description}
                                            </td>
                                            <td data-label="Số sản phẩm">
                                                <span className="badge badge--neutral" style={{ fontWeight: 600 }}>{productCount} sản phẩm</span>
                                            </td>
                                            <td data-label="Trạng thái">
                                                <span className={`badge badge--${isActive ? 'success' : 'neutral'}`}>
                                                    {isActive ? 'Hoạt động' : 'Đang ẩn'}
                                                </span>
                                            </td>
                                            <td data-label="" className="td-actions">
                                                <button className="icon-btn icon-btn--sm" title="Sửa" onClick={() => openModal(c)}><Pencil size={16} /></button>
                                                <button className="icon-btn icon-btn--sm" title="Xóa" onClick={() => handleDelete(c)}><Trash2 size={16} /></button>
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
                        {totalItems > 0 ? `Hiển thị ${(page - 1) * per + 1}–${Math.min(page * per, totalItems)} trong ${totalItems} danh mục` : "0 danh mục"}
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
                isOpen={editingCategory !== null}
                onClose={() => setEditingCategory(null)}
                title={editingCategory === 'new' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                size="md"
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn--ghost" onClick={() => setEditingCategory(null)}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Đang lưu…' : editingCategory === 'new' ? 'Thêm' : 'Lưu thay đổi'}
                        </button>
                    </div>
                }
            >
                <form className="form" id="categoryForm" onSubmit={handleSave}>
                    <div className="field">
                        <span>Tên danh mục *</span>
                        <input
                            className="input"
                            required
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="VD: Giày dép"
                        />
                    </div>
                    <div className="field">
                        <span>Mô tả</span>
                        <textarea
                            className="input"
                            rows={3}
                            value={formDesc}
                            onChange={e => setFormDesc(e.target.value)}
                            placeholder="Nhập mô tả ngắn gọn cho danh mục..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                        <input
                            type="checkbox"
                            checked={formHidden}
                            onChange={e => setFormHidden(e.target.checked)}
                            style={{ width: 15, height: 15, accentColor: 'var(--primary)' }}
                        />
                        <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>Ẩn danh mục này</span>
                    </label>
                </form>
            </Modal>
        </section>
    );
}
