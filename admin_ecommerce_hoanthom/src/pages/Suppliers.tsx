import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, ChevronsUpDown, ChevronUp, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Supplier } from '../types';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type SupplierPayload } from '../services/suppliers';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

export function Suppliers() {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<keyof Supplier>('name');
    const [sortDir, setSortDir] = useState<-1 | 1>(1);
    const [page, setPage] = useState(1);
    const per = 10;

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | 'new' | null>(null);

    const [formName, setFormName] = useState('');
    const [formContactName, setFormContactName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formNote, setFormNote] = useState('');

    useEffect(() => {
        getSuppliers()
            .then(setSuppliers)
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải danh sách nhà cung cấp từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const openModal = (s: Supplier | 'new') => {
        setEditingSupplier(s);
        if (s === 'new') {
            setFormName('');
            setFormContactName('');
            setFormPhone('');
            setFormEmail('');
            setFormAddress('');
            setFormNote('');
        } else {
            setFormName(s.name);
            setFormContactName(s.contact_name ?? '');
            setFormPhone(s.phone ?? '');
            setFormEmail(s.email ?? '');
            setFormAddress(s.address ?? '');
            setFormNote(s.note ?? '');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;
        if (!formName.trim()) {
            showToast('error', 'Thiếu thông tin', 'Vui lòng nhập Tên nhà cung cấp trước khi lưu.');
            return;
        }

        const payload: SupplierPayload = {
            name: formName.trim(),
            contact_name: formContactName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim(),
            address: formAddress.trim(),
            note: formNote.trim(),
        };

        setSaving(true);
        try {
            if (editingSupplier === 'new') {
                const created = await createSupplier(payload);
                setSuppliers(prev => [created, ...prev]);
                showToast('success', 'Đã thêm nhà cung cấp', 'Nhà cung cấp mới đã được tạo.');
            } else if (editingSupplier) {
                const updated = await updateSupplier(editingSupplier.id, payload);
                setSuppliers(prev => prev.map(s => (s.id === updated.id ? updated : s)));
                showToast('success', 'Đã lưu thay đổi', 'Thông tin nhà cung cấp đã được cập nhật.');
            }
            setEditingSupplier(null);
        } catch {
            showToast('error', 'Lỗi', 'Không thể lưu nhà cung cấp. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (s: Supplier) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp ${s.name}?`)) return;
        try {
            await deleteSupplier(s.id);
            setSuppliers(prev => prev.filter(x => x.id !== s.id));
            showToast('success', 'Đã xóa nhà cung cấp', `${s.name} đã được xóa khỏi hệ thống.`);
        } catch {
            showToast('error', 'Lỗi', 'Không thể xóa nhà cung cấp. Vui lòng thử lại.');
        }
    };

    const filteredSuppliers = useMemo(() => {
        const rows = suppliers.filter((s) => {
            const q = search.toLowerCase();
            return (
                s.name.toLowerCase().includes(q) ||
                (s.contact_name ?? '').toLowerCase().includes(q) ||
                (s.phone ?? '').toLowerCase().includes(q) ||
                (s.email ?? '').toLowerCase().includes(q)
            );
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
    }, [suppliers, search, sortKey, sortDir]);

    const totalItems = filteredSuppliers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / per));
    const currentRows = filteredSuppliers.slice((page - 1) * per, page * per);

    const handleSort = (key: keyof Supplier) => {
        if (sortKey === key) {
            setSortDir(prev => (prev === 1 ? -1 : 1));
        } else {
            setSortKey(key);
            setSortDir(1);
        }
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof Supplier }) => {
        if (sortKey !== columnKey) return <ChevronsUpDown size={14} />;
        return sortDir === 1 ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
    };

    return (
        <section className="page active" id="page-suppliers" data-title="Nhà cung cấp">
            <div className="page-head">
                <div>
                    <h1>Nhà cung cấp</h1>
                    <p className="page-sub">Quản lý nhà cung cấp hàng hóa, phục vụ nghiệp vụ nhập hàng.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={() => openModal('new')}>
                        <Plus size={18} /> Thêm nhà cung cấp
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="toolbar">
                    <div className="search search--table">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, người liên hệ, SĐT, email…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="sortable" onClick={() => handleSort('name')} style={{ width: '22%' }}>Tên nhà cung cấp <SortIcon columnKey="name" /></th>
                                <th className="sortable" onClick={() => handleSort('contact_name')}>Người liên hệ <SortIcon columnKey="contact_name" /></th>
                                <th>Liên hệ</th>
                                <th style={{ width: '25%' }}>Địa chỉ</th>
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
                                            <strong>Không tìm thấy nhà cung cấp</strong>
                                            <p>Thử đổi từ khoá hoặc thêm nhà cung cấp mới.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map(s => (
                                    <tr key={s.id}>
                                        <td data-label="Tên nhà cung cấp">
                                            <strong>{s.name}</strong>
                                        </td>
                                        <td data-label="Người liên hệ" className="cell-muted">{s.contact_name}</td>
                                        <td data-label="Liên hệ">
                                            <span style={{ display: "block" }}>{s.email}</span>
                                            <span className="cell-sub">{s.phone}</span>
                                        </td>
                                        <td data-label="Địa chỉ" className="cell-muted" style={{ whiteSpace: 'normal', minWidth: '180px' }}>
                                            {s.address}
                                        </td>
                                        <td data-label="" className="td-actions">
                                            <button className="icon-btn icon-btn--sm" title="Sửa" onClick={() => openModal(s)}><Pencil size={16} /></button>
                                            <button className="icon-btn icon-btn--sm" title="Xóa" onClick={() => handleDelete(s)}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-foot">
                    <p className="table-count">
                        {totalItems > 0 ? `Hiển thị ${(page - 1) * per + 1}–${Math.min(page * per, totalItems)} trong ${totalItems} nhà cung cấp` : "0 nhà cung cấp"}
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
                isOpen={editingSupplier !== null}
                onClose={() => setEditingSupplier(null)}
                title={editingSupplier === 'new' ? 'Thêm nhà cung cấp mới' : 'Chỉnh sửa nhà cung cấp'}
                size="md"
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn--ghost" onClick={() => setEditingSupplier(null)}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Đang lưu…' : editingSupplier === 'new' ? 'Thêm' : 'Lưu thay đổi'}
                        </button>
                    </div>
                }
            >
                <form className="form" id="supplierForm" onSubmit={handleSave}>
                    <div className="field">
                        <span>Tên nhà cung cấp <em className="required-mark">*</em></span>
                        <input
                            className="input"
                            required
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="VD: Công ty TNHH ABC"
                        />
                    </div>
                    <div className="field">
                        <span>Người liên hệ</span>
                        <input
                            className="input"
                            value={formContactName}
                            onChange={e => setFormContactName(e.target.value)}
                            placeholder="VD: Nguyễn Văn A"
                        />
                    </div>
                    <div className="field">
                        <span>Số điện thoại</span>
                        <input
                            className="input"
                            value={formPhone}
                            onChange={e => setFormPhone(e.target.value)}
                            placeholder="VD: 0901234567"
                        />
                    </div>
                    <div className="field">
                        <span>Email</span>
                        <input
                            className="input"
                            type="email"
                            value={formEmail}
                            onChange={e => setFormEmail(e.target.value)}
                            placeholder="VD: contact@supplier.com"
                        />
                    </div>
                    <div className="field">
                        <span>Địa chỉ</span>
                        <input
                            className="input"
                            value={formAddress}
                            onChange={e => setFormAddress(e.target.value)}
                            placeholder="Địa chỉ nhà cung cấp"
                        />
                    </div>
                    <div className="field">
                        <span>Ghi chú</span>
                        <textarea
                            className="input"
                            rows={3}
                            value={formNote}
                            onChange={e => setFormNote(e.target.value)}
                            placeholder="Ghi chú thêm về nhà cung cấp..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                </form>
            </Modal>
        </section>
    );
}
