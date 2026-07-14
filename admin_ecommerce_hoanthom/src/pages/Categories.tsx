import { useState, useMemo } from 'react';
import { Plus, Search, ChevronsUpDown, ChevronUp, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockProducts, CATEGORIES } from '../data/mock';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

type CategoryItem = {
    id: string;
    name: string;
    desc: string;
    status: 'active' | 'hidden';
};

const mockCategories: CategoryItem[] = CATEGORIES.map(c => ({
    id: c,
    name: c,
    desc: `Cung cấp các sản phẩm thuộc danh mục ${c.toLowerCase()} chất lượng cao.`,
    status: 'active'
}));

export function Categories() {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<keyof CategoryItem>('name');
    const [sortDir, setSortDir] = useState<-1 | 1>(1);
    const [page, setPage] = useState(1);
    const per = 10;

    const [categories, setCategories] = useState<CategoryItem[]>(mockCategories);
    const [editingCategory, setEditingCategory] = useState<CategoryItem | 'new' | null>(null);

    const openModal = (c: CategoryItem | 'new') => {
        setEditingCategory(c);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        showToast('success', editingCategory === 'new' ? 'Đã thêm danh mục' : 'Đã lưu thay đổi', 'Thông tin danh mục đã được cập nhật.');
        setEditingCategory(null);
    };

    const filteredCategories = useMemo(() => {
        let rows = categories.filter((c) => {
            const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase());
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

    const handleSort = (key: keyof CategoryItem) => {
        if (sortKey === key) {
            setSortDir(prev => (prev === 1 ? -1 : 1));
        } else {
            setSortKey(key);
            setSortDir(1);
        }
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof CategoryItem }) => {
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
                                <th className="sortable" onClick={() => handleSort('desc')} style={{ width: '40%' }}>Mô tả <SortIcon columnKey="desc" /></th>
                                <th>Số sản phẩm</th>
                                <th className="sortable" onClick={() => handleSort('status')}>Trạng thái <SortIcon columnKey="status" /></th>
                                <th className="th-actions">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.length === 0 ? (
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
                                                {c.desc}
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
                                                <button className="icon-btn icon-btn--sm" title="Xóa" onClick={() => {
                                                    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục ${c.name}?`)) {
                                                        setCategories(categories.filter(x => x.id !== c.id));
                                                        showToast('success', 'Đã xóa danh mục', `${c.name} đã được xóa khỏi hệ thống.`);
                                                    }
                                                }}><Trash2 size={16} /></button>
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
                        <button className="btn btn--primary" onClick={handleSave}>{editingCategory === 'new' ? 'Thêm' : 'Lưu thay đổi'}</button>
                    </div>
                }
            >
                <form className="form" id="categoryForm" onSubmit={handleSave}>
                    <div className="field">
                        <span>Tên danh mục *</span>
                        <input className="input" required defaultValue={editingCategory !== 'new' && editingCategory ? editingCategory.name : ''} placeholder="VD: Giày dép" />
                    </div>
                    <div className="field">
                        <span>Mô tả</span>
                        <textarea
                            className="input"
                            rows={3}
                            defaultValue={editingCategory !== 'new' && editingCategory ? editingCategory.desc : ''}
                            placeholder="Nhập mô tả ngắn gọn cho danh mục..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                        <input
                            type="checkbox"
                            defaultChecked={editingCategory !== 'new' && editingCategory?.status === 'hidden'}
                            style={{ width: 15, height: 15, accentColor: 'var(--primary)' }}
                        />
                        <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>Ẩn danh mục này</span>
                    </label>
                </form>
            </Modal>
        </section>
    );
}
