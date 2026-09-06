import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Pencil, Trash2, Crown, Briefcase, User } from 'lucide-react';
import type { Staff as StaffType } from '../types';
import { getRoles, type ApiRole } from '../services/roles';
import { getUsers, createUser, updateUser, deleteUser, type UserPayload } from '../services/users';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

const PERM_MODULES = ["Sản phẩm", "Đơn hàng", "Khách hàng", "Khuyến mãi"];

const ROLE_VISUALS: Record<string, { icon: string; grad: string }> = {
    admin: { icon: 'Crown', grad: 'var(--grad-primary)' },
    manager: { icon: 'Briefcase', grad: 'var(--grad-teal)' },
    staff: { icon: 'User', grad: 'var(--grad-amber)' },
};
const DEFAULT_ROLE_VISUAL = { icon: 'User', grad: 'var(--grad-primary)' };

const iconMap: Record<string, React.ElementType> = {
    Crown, Briefcase, User
};

const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

const fmtLastActive = (iso: string | null) => {
    if (!iso) return 'Chưa từng đăng nhập';
    return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export function Staff() {
    const { showToast } = useToast();
    const [roles, setRoles] = useState<ApiRole[]>([]);
    const [staffList, setStaffList] = useState<StaffType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingStaff, setEditingStaff] = useState<StaffType | 'new' | null>(null);
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formRoleId, setFormRoleId] = useState<number>(0);
    const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
    const [formPassword, setFormPassword] = useState('');

    useEffect(() => {
        Promise.all([getRoles(), getUsers()])
            .then(([rolesData, usersData]) => {
                setRoles(rolesData);
                setStaffList(usersData.map(u => ({
                    id: u.id,
                    name: u.full_name,
                    email: u.email,
                    phone: u.phone,
                    roleId: u.role,
                    status: u.status,
                    lastActive: u.last_active_at,
                })));
            })
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải danh sách nhân viên từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const roleById = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles]);
    const selectedRole = roleById.get(formRoleId);

    const openModal = (s: StaffType | 'new') => {
        setEditingStaff(s);
        if (s === 'new') {
            setFormName('');
            setFormEmail('');
            setFormPhone('');
            setFormRoleId(roles[0]?.id ?? 0);
            setFormStatus('active');
            setFormPassword('');
        } else {
            setFormName(s.name);
            setFormEmail(s.email);
            setFormPhone(s.phone ?? '');
            setFormRoleId(s.roleId);
            setFormStatus(s.status);
            setFormPassword('');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        const passwordValid = editingStaff === 'new'
            ? formPassword.trim().length >= 8
            : (!formPassword.trim() || formPassword.trim().length >= 8);

        if (!formName.trim() || !formEmail.trim() || !formRoleId) {
            showToast('error', 'Thiếu thông tin', 'Vui lòng nhập Họ tên, Email và chọn Vai trò trước khi lưu.');
            return;
        }
        if (!passwordValid) {
            showToast('error', 'Mật khẩu không hợp lệ', 'Mật khẩu phải có ít nhất 8 ký tự.');
            return;
        }

        const payload: UserPayload = {
            role: formRoleId,
            full_name: formName.trim(),
            email: formEmail.trim(),
            phone: formPhone.trim() || null,
            status: formStatus,
            ...(formPassword.trim() ? { password: formPassword.trim() } : {}),
        };

        setSaving(true);
        try {
            if (editingStaff === 'new') {
                const created = await createUser(payload);
                setStaffList(prev => [{
                    id: created.id, name: created.full_name, email: created.email, phone: created.phone,
                    roleId: created.role, status: created.status, lastActive: created.last_active_at,
                }, ...prev]);
                showToast('success', 'Đã thêm nhân viên', 'Tài khoản nhân viên đã được tạo.');
            } else if (editingStaff) {
                const updated = await updateUser(editingStaff.id, payload);
                setStaffList(prev => prev.map(s => s.id === updated.id ? {
                    id: updated.id, name: updated.full_name, email: updated.email, phone: updated.phone,
                    roleId: updated.role, status: updated.status, lastActive: updated.last_active_at,
                } : s));
                showToast('success', 'Đã lưu thay đổi', 'Thông tin nhân viên đã được cập nhật.');
            }
            setEditingStaff(null);
        } catch {
            showToast('error', 'Lỗi', 'Không thể lưu nhân viên. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (s: StaffType) => {
        if (!window.confirm(`Xóa nhân viên ${s.name}?`)) return;
        try {
            await deleteUser(s.id);
            setStaffList(prev => prev.filter(x => x.id !== s.id));
            showToast('success', 'Đã xóa nhân viên', `Tài khoản của ${s.name} đã bị gỡ bỏ.`);
        } catch {
            showToast('error', 'Lỗi', 'Không thể xóa nhân viên. Vui lòng thử lại.');
        }
    };

    return (
        <section className="page active" id="page-staff" data-title="Nhân viên">
            <div className="page-head">
                <div>
                    <h1>Nhân viên &amp; phân quyền</h1>
                    <p className="page-sub">Quản lý tài khoản và quyền truy cập hệ thống.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={() => openModal('new')} disabled={roles.length === 0}>
                        <UserPlus size={18} /> Thêm nhân viên
                    </button>
                </div>
            </div>

            <div className="role-cards">
                {roles.map(r => {
                    const visual = ROLE_VISUALS[r.code] ?? DEFAULT_ROLE_VISUAL;
                    const count = staffList.filter((s) => s.roleId === r.id).length;
                    const IconComp = iconMap[visual.icon] || User;
                    return (
                        <article key={r.id} className="card role-card">
                            <div className="role-card__icon" style={{ background: visual.grad }}>
                                <IconComp size={24} />
                            </div>
                            <div>
                                <strong>{r.name} · {count}</strong>
                                <p>{r.description}</p>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className="card">
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Hoạt động gần nhất</th>
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
                            ) : staffList.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <strong>Chưa có nhân viên</strong>
                                            <p>Bấm "Thêm nhân viên" để tạo tài khoản đầu tiên.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                staffList.map(s => {
                                    const role = roleById.get(s.roleId);
                                    const visual = role ? (ROLE_VISUALS[role.code] ?? DEFAULT_ROLE_VISUAL) : DEFAULT_ROLE_VISUAL;
                                    return (
                                        <tr key={s.id}>
                                            <td data-label="Nhân viên">
                                                <div className="cell-person">
                                                    <div className="avatar avatar--sm" style={{ background: visual.grad }}>
                                                        {initials(s.name)}
                                                    </div>
                                                    <div>
                                                        <strong>{s.name}</strong>
                                                        <small>{s.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Vai trò">
                                                <span className="badge badge--primary">{role?.name ?? '—'}</span>
                                            </td>
                                            <td data-label="Trạng thái">
                                                <span className={`badge badge--${s.status === "active" ? "success" : "neutral"}`}>
                                                    {s.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}
                                                </span>
                                            </td>
                                            <td data-label="Hoạt động" className="cell-muted">{fmtLastActive(s.lastActive)}</td>
                                            <td data-label="" className="td-actions">
                                                <button className="icon-btn icon-btn--sm" title="Sửa & phân quyền" onClick={() => openModal(s)}><Pencil size={16} /></button>
                                                <button className="icon-btn icon-btn--sm" title="Xóa" onClick={() => handleDelete(s)}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={editingStaff !== null}
                onClose={() => setEditingStaff(null)}
                title={editingStaff === 'new' ? 'Thêm nhân viên' : 'Chỉnh sửa nhân viên'}
                size="lg"
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn--ghost" onClick={() => setEditingStaff(null)}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Đang lưu…' : editingStaff === 'new' ? 'Thêm nhân viên' : 'Lưu thay đổi'}
                        </button>
                    </div>
                }
            >
                <form className="form" onSubmit={handleSave}>
                    <div className="form-row">
                        <label className="field">
                            <span>Họ tên <em className="required-mark">*</em></span>
                            <input className="input" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="VD: Nguyễn Văn A" />
                        </label>
                        <label className="field">
                            <span>Email <em className="required-mark">*</em></span>
                            <input className="input" type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="ten@aurora.vn" />
                        </label>
                    </div>
                    <div className="form-row">
                        <label className="field">
                            <span>Số điện thoại</span>
                            <input className="input" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="VD: 0901234567" />
                        </label>
                        <label className="field">
                            <span>Vai trò <em className="required-mark">*</em></span>
                            <select className="select select--full" value={formRoleId} onChange={e => setFormRoleId(Number(e.target.value))}>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="form-row">
                        <label className="field">
                            <span>{editingStaff === 'new' ? <>Mật khẩu <em className="required-mark">*</em></> : 'Mật khẩu mới'}</span>
                            <input
                                className="input"
                                type="password"
                                required={editingStaff === 'new'}
                                minLength={8}
                                value={formPassword}
                                onChange={e => setFormPassword(e.target.value)}
                                placeholder={editingStaff === 'new' ? 'Tối thiểu 8 ký tự' : 'Để trống nếu không đổi mật khẩu'}
                            />
                        </label>
                        <label className="field">
                            <span>Trạng thái</span>
                            <select className="select select--full" value={formStatus} onChange={e => setFormStatus(e.target.value as 'active' | 'inactive')}>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Ngưng hoạt động</option>
                            </select>
                        </label>
                    </div>
                    <div className="field">
                        <span>Quyền truy cập theo module (theo vai trò đã chọn)</span>
                        <div className="perm-grid">
                            {PERM_MODULES.map(m => (
                                <div key={m} className="perm-row">
                                    <span>{m}</span>
                                    <div className="perm-checks">
                                        {(['view', 'create', 'edit', 'delete'] as const).map(p => {
                                            const hasPerm = selectedRole?.permissions?.[m]?.includes(p);
                                            const label = { view: 'Xem', create: 'Tạo', edit: 'Sửa', delete: 'Xóa' }[p];
                                            return (
                                                <label key={p}>
                                                    <input type="checkbox" checked={hasPerm || false} readOnly />
                                                    {label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
