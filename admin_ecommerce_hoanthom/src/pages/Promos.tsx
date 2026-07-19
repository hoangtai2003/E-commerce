import { useState, useEffect } from 'react';
import { Plus, Copy, Pencil, Trash2 } from 'lucide-react';
import type { Promo } from '../types';
import {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionActive,
    type PromotionPayload,
} from '../services/promotions';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";
const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("vi-VN") : "Không giới hạn";

export function Promos() {
    const { showToast } = useToast();
    const [promos, setPromos] = useState<Promo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promo | 'new' | null>(null);

    const [formCode, setFormCode] = useState('');
    const [formType, setFormType] = useState<'percent' | 'fixed'>('percent');
    const [formValue, setFormValue] = useState('');
    const [formMinOrder, setFormMinOrder] = useState('');
    const [formLimit, setFormLimit] = useState('');
    const [formEnd, setFormEnd] = useState('');
    const [formDesc, setFormDesc] = useState('');

    useEffect(() => {
        getPromotions()
            .then(setPromos)
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải danh sách khuyến mãi từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const openModal = (p: Promo | 'new') => {
        setEditingPromo(p);
        if (p === 'new') {
            setFormCode('');
            setFormType('percent');
            setFormValue('');
            setFormMinOrder('');
            setFormLimit('');
            setFormEnd('');
            setFormDesc('');
        } else {
            setFormCode(p.code);
            setFormType(p.type);
            setFormValue(String(p.value));
            setFormMinOrder(String(p.minOrder));
            setFormLimit(String(p.limit));
            setFormEnd(p.end ? p.end.split('T')[0] : '');
            setFormDesc(p.desc);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formCode.trim() || !formValue || !formEnd || saving || !editingPromo) return;

        const payload: PromotionPayload = {
            code: formCode.trim().toUpperCase(),
            description: formDesc.trim() || null,
            discount_type: formType,
            discount_value: Number(formValue) || 0,
            min_order: Number(formMinOrder) || 0,
            usage_limit: Number(formLimit) || 0,
            ends_at: formEnd,
            is_active: editingPromo === 'new' ? true : editingPromo.active,
        };

        setSaving(true);
        try {
            if (editingPromo === 'new') {
                const created = await createPromotion(payload);
                setPromos(prev => [created, ...prev]);
                showToast('success', 'Đã tạo mã giảm giá', 'Mã khuyến mãi mới đã được tạo.');
            } else if (editingPromo) {
                const updated = await updatePromotion(editingPromo.id, payload);
                setPromos(prev => prev.map(p => (p.id === updated.id ? updated : p)));
                showToast('success', 'Đã lưu thay đổi', 'Thông tin khuyến mãi đã được cập nhật.');
            }
            setEditingPromo(null);
        } catch {
            showToast('error', 'Lỗi', 'Không thể lưu mã giảm giá. Kiểm tra giá trị % phải trong khoảng 1-100.');
        } finally {
            setSaving(false);
        }
    };

    const togglePromo = async (id: number) => {
        const target = promos.find(p => p.id === id);
        if (!target) return;
        const newActive = !target.active;
        try {
            const updated = await togglePromotionActive(id, newActive);
            setPromos(prev => prev.map(p => (p.id === id ? updated : p)));
            if (newActive) {
                showToast('success', 'Đã bật mã giảm giá', `Mã ${target.code} hiện áp dụng được.`);
            } else {
                showToast('info', 'Đã tắt mã giảm giá', `Mã ${target.code} hiện ngừng áp dụng.`);
            }
        } catch {
            showToast('error', 'Lỗi', 'Không thể cập nhật trạng thái mã giảm giá.');
        }
    };

    const handleDelete = async (pr: Promo) => {
        if (!window.confirm(`Xóa mã giảm giá ${pr.code}?`)) return;
        try {
            await deletePromotion(pr.id);
            setPromos(prev => prev.filter(x => x.id !== pr.id));
            showToast('success', 'Đã xóa mã giảm giá', `Mã ${pr.code} đã được gỡ bỏ.`);
        } catch {
            showToast('error', 'Lỗi', 'Không thể xóa mã giảm giá. Vui lòng thử lại.');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('success', 'Đã sao chép', `Mã ${text} đã nằm trong clipboard.`);
        }).catch(() => {
            showToast('error', 'Không sao chép được', 'Trình duyệt chặn quyền truy cập clipboard.');
        });
    };

    return (
        <section className="page active" id="page-promos" data-title="Khuyến mãi">
            <div className="page-head">
                <div>
                    <h1>Khuyến mãi</h1>
                    <p className="page-sub">Tạo và theo dõi hiệu quả mã giảm giá.</p>
                </div>
                <div className="page-head__actions">
                    <button className="btn btn--primary" onClick={() => openModal('new')}>
                        <Plus size={18} /> Tạo mã giảm giá
                    </button>
                </div>
            </div>
            <div className="promo-grid">
                {loading ? (
                    <div className="card" style={{ gridColumn: '1/-1' }}>
                        <div className="empty-state">
                            <strong>Đang tải…</strong>
                        </div>
                    </div>
                ) : promos.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1/-1' }}>
                        <div className="empty-state">
                            <strong>Chưa có mã giảm giá</strong>
                            <p>Tạo mã đầu tiên để thu hút khách hàng quay lại mua sắm.</p>
                        </div>
                    </div>
                ) : (
                    promos.map(pr => {
                        const pct = pr.limit > 0 ? Math.min(100, Math.round((pr.used / pr.limit) * 100)) : 0;
                        const valueText = pr.type === "percent" ? `Giảm ${pr.value}%` : `Giảm ${fmtMoney(pr.value)}`;
                        return (
                            <article key={pr.id} className={`card promo-card ${pr.active ? "" : "inactive"}`}>
                                <div className="promo-card__top">
                                    <span className="promo-code">
                                        {pr.code}
                                        <button title="Sao chép mã" onClick={() => copyToClipboard(pr.code)}>
                                            <Copy size={16} />
                                        </button>
                                    </span>
                                    <span className={`badge badge--${pr.active ? "success" : "neutral"}`}>
                                        {pr.active ? "Đang chạy" : "Đã tắt"}
                                    </span>
                                </div>
                                <div>
                                    <div className="promo-card__value">{valueText}</div>
                                    <p className="promo-card__desc">{pr.desc} · Đơn tối thiểu {fmtMoney(pr.minOrder)}</p>
                                </div>
                                <div>
                                    <div className="promo-usage">
                                        <span>Đã dùng {pr.used}/{pr.limit > 0 ? pr.limit : '∞'}</span>
                                        <span>HSD: {fmtDate(pr.end)}</span>
                                    </div>
                                    <div className="promo-bar">
                                        <span style={{ width: `${pct}%` }}></span>
                                    </div>
                                </div>
                                <div className="promo-card__foot">
                                    <label className="switch" title="Bật / tắt mã">
                                        <input type="checkbox" checked={pr.active} onChange={() => togglePromo(pr.id)} />
                                        <span className="switch__track"></span>
                                    </label>
                                    <div className="actions">
                                        <button className="icon-btn icon-btn--sm" title="Sửa" onClick={() => openModal(pr)}><Pencil size={16} /></button>
                                        <button className="icon-btn icon-btn--sm" title="Xóa" onClick={() => handleDelete(pr)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            <Modal
                isOpen={editingPromo !== null}
                onClose={() => setEditingPromo(null)}
                title={editingPromo === 'new' ? 'Tạo mã giảm giá' : 'Chỉnh sửa mã giảm giá'}
                size="lg"
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn--ghost" onClick={() => setEditingPromo(null)}>Hủy bỏ</button>
                        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Đang lưu…' : editingPromo === 'new' ? 'Tạo mã mới' : 'Lưu thay đổi'}
                        </button>
                    </div>
                }
            >
                <form className="form" onSubmit={handleSave}>
                    <div className="form-row">
                        <label className="field">
                            <span>Mã code *</span>
                            <input
                                className="input"
                                style={{ textTransform: 'uppercase' }}
                                required
                                value={formCode}
                                onChange={e => setFormCode(e.target.value)}
                                placeholder="VD: SALE50"
                            />
                        </label>
                        <label className="field">
                            <span>Loại giảm giá</span>
                            <select className="select select--full" value={formType} onChange={e => setFormType(e.target.value as 'percent' | 'fixed')}>
                                <option value="percent">Theo phần trăm (%)</option>
                                <option value="fixed">Số tiền cố định</option>
                            </select>
                        </label>
                    </div>
                    <div className="form-row">
                        <label className="field">
                            <span>Giá trị giảm * {formType === 'percent' && '(1-100)'}</span>
                            <input
                                className="input"
                                type="number"
                                required
                                min={1}
                                max={formType === 'percent' ? 100 : undefined}
                                value={formValue}
                                onChange={e => setFormValue(e.target.value)}
                                placeholder="VD: 20"
                            />
                        </label>
                        <label className="field">
                            <span>Đơn tối thiểu</span>
                            <input className="input" type="number" min={0} value={formMinOrder} onChange={e => setFormMinOrder(e.target.value)} placeholder="VD: 200000" />
                        </label>
                    </div>
                    <div className="form-row">
                        <label className="field">
                            <span>Giới hạn sử dụng</span>
                            <input className="input" type="number" min={0} value={formLimit} onChange={e => setFormLimit(e.target.value)} placeholder="VD: 500 (để trống = không giới hạn)" />
                        </label>
                        <label className="field">
                            <span>Ngày hết hạn *</span>
                            <input className="input" type="date" required value={formEnd} onChange={e => setFormEnd(e.target.value)} />
                        </label>
                    </div>
                    <label className="field">
                        <span>Mô tả ngắn</span>
                        <input className="input" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="VD: Ưu đãi hè cho mọi đơn hàng" />
                    </label>
                </form>
            </Modal>
        </section>
    );
}
