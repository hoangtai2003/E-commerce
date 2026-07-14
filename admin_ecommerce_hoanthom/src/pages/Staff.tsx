import { useState } from 'react';
import { UserPlus, Pencil, Trash2, Crown, Briefcase, User } from 'lucide-react';
import { mockStaff, ROLES, PERM_MODULES, ROLE_PERMS } from '../data/mock';
import type { Staff as StaffType } from '../types';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

const iconMap: Record<string, React.ElementType> = {
    Crown, Briefcase, User
};

export function Staff() {
    const { showToast } = useToast();
    const [staffList, setStaffList] = useState<StaffType[]>(mockStaff);
    const [editingStaff, setEditingStaff] = useState<StaffType | 'new' | null>(null);
    const [selectedRole, setSelectedRole] = useState<keyof typeof ROLES>('staff');

    const openModal = (s: StaffType | 'new') => {
        setEditingStaff(s);
        setSelectedRole(s === 'new' ? 'staff' : (s.role as keyof typeof ROLES));
    };

    const handleSave = () => {
        showToast('success', editingStaff === 'new' ? 'Đã thêm nhân viên' : 'Đã lưu thay đổi', 'Thông tin nhân viên đã được cập nhật.');
        setEditingStaff(null);
    };

    return (
        <section className="page active" id="page-staff" data-title="Nhân viên">
            <div className="page-head">
                <div>
                    <h1>Nhân viên &amp; phân quyền</h1>
                    <p className="page-sub">Quản lý tài khoản và quyền truy cập hệ thống.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={() => openModal('new')}>
                        <UserPlus size={18} /> Thêm nhân viên
                    </button>
                </div>
            </div>

            <div className="role-cards">
                {Object.entries(ROLES).map(([key, r]) => {
                    const count = staffList.filter((s) => s.role === key).length;
                    const IconComp = iconMap[r.icon] || User;
                    return (
                        <article key={key} className="card role-card">
                            <div className="role-card__icon" style={{ background: r.grad }}>
                                <IconComp size={24} />
                            </div>
                            <div>
                                <strong>{r.name} · {count}</strong>
                                <p>{r.desc}</p>
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
                            {staffList.map(s => {
                                const roleInfo = ROLES[s.role as keyof typeof ROLES] || ROLES.staff;
                                return (
                                    <tr key={s.id}>
                                        <td data-label="Nhân viên">
                                            <div className="cell-person">
                                                <div className="avatar avatar--sm" style={{ background: roleInfo.grad }}>
                                                    {initials(s.name)}
                                                </div>
                                                <div>
                                                    <strong>{s.name}</strong>
                                                    <small>{s.email}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Vai trò">
                                            <span className="badge badge--primary">{roleInfo.name}</span>
                                        </td>
                                        <td data-label="Trạng thái">
                                            <span className={`badge badge--${s.status === "active" ? "success" : "neutral"}`}>
                                                {s.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}
                                            </span>
                                        </td>
                                        <td data-label="Hoạt động" className="cell-muted">{s.lastActive}</td>
                                        <td data-label="" className="td-actions">
                                            <button className="icon-btn icon-btn--sm" title="Sửa & phân quyền" onClick={() => openModal(s)}><Pencil size={16} /></button>
                                            <button className="icon-btn icon-btn--sm" title="Xóa" onClick={() => {
                                                if (window.confirm(`Xóa nhân viên ${s.name}?`)) {
                                                    setStaffList(staffList.filter(x => x.id !== s.id));
                                                    showToast('success', 'Đã xóa nhân viên', `Tài khoản của ${s.name} đã bị gỡ bỏ.`);
                                                }
                                            }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
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
                        <button className="btn btn--primary" onClick={handleSave}>{editingStaff === 'new' ? 'Thêm nhân viên' : 'Lưu thay đổi'}</button>
                    </div>
                }
            >
                <form className="form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="form-row">
                        <label className="field">
                            <span>Họ tên *</span>
                            <input className="input" defaultValue={editingStaff !== 'new' && editingStaff ? editingStaff.name : ''} placeholder="VD: Nguyễn Văn A" />
                        </label>
                        <label className="field">
                            <span>Email *</span>
                            <input className="input" type="email" defaultValue={editingStaff !== 'new' && editingStaff ? editingStaff.email : ''} placeholder="ten@aurora.vn" />
                        </label>
                    </div>
                    <div className="form-row">
                        <label className="field">
                            <span>Vai trò</span>
                            <select className="select select--full" value={selectedRole} onChange={e => setSelectedRole(e.target.value as keyof typeof ROLES)}>
                                {Object.entries(ROLES).map(([k, r]) => (
                                    <option key={k} value={k}>{r.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="field">
                            <span>Trạng thái</span>
                            <select className="select select--full" defaultValue={editingStaff !== 'new' && editingStaff ? editingStaff.status : 'active'}>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Ngưng hoạt động</option>
                            </select>
                        </label>
                    </div>
                    <div className="field">
                        <span>Quyền truy cập theo module</span>
                        <div className="perm-grid">
                            {PERM_MODULES.map(m => (
                                <div key={m} className="perm-row">
                                    <span>{m}</span>
                                    <div className="perm-checks">
                                        {(['view', 'create', 'edit', 'delete'] as const).map(p => {
                                            const hasPerm = ROLE_PERMS[selectedRole]?.[m as keyof typeof ROLE_PERMS[keyof typeof ROLE_PERMS]]?.includes(p);
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
