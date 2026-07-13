import { UserPlus, Pencil, Trash2, Crown, Briefcase, User } from 'lucide-react';
import { mockStaff, ROLES } from '../data/mock';
import { useToast } from '../contexts/ToastContext';

const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

const iconMap: Record<string, React.ElementType> = {
    Crown, Briefcase, User
};

export function Staff() {
    const { showToast } = useToast();
    return (
        <section className="page active" id="page-staff" data-title="Nhân viên">
            <div className="page-head">
                <div>
                    <h1>Nhân viên &amp; phân quyền</h1>
                    <p className="page-sub">Quản lý tài khoản và quyền truy cập hệ thống.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={() => showToast('info', 'Chức năng sẽ sớm ra mắt')}>
                        <UserPlus size={18} /> Thêm nhân viên
                    </button>
                </div>
            </div>

            <div className="role-cards">
                {Object.entries(ROLES).map(([key, r]) => {
                    const count = mockStaff.filter((s) => s.role === key).length;
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
                            {mockStaff.map(s => {
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
                                            <button className="icon-btn icon-btn--sm" title="Sửa & phân quyền"><Pencil size={16} /></button>
                                            <button className="icon-btn icon-btn--sm" title="Xóa"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
