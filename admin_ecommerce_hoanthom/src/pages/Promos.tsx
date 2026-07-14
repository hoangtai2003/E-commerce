import { useState } from 'react';
import { Plus, Copy, Pencil, Trash2 } from 'lucide-react';
import { mockPromos } from '../data/mock';
import type { Promo } from '../types';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

export function Promos() {
  const { showToast } = useToast();
  const [promos, setPromos] = useState<Promo[]>(mockPromos);
  const [editingPromo, setEditingPromo] = useState<Promo | 'new' | null>(null);
  
  const handleSave = () => {
    showToast('success', editingPromo === 'new' ? 'Đã tạo mã giảm giá' : 'Đã lưu thay đổi', 'Thông tin khuyến mãi đã được cập nhật.');
    setEditingPromo(null);
  };

  const togglePromo = (id: number) => {
    setPromos(promos.map(p => {
      if (p.id === id) {
        const newActive = !p.active;
        if (newActive) {
          showToast('success', 'Đã bật mã giảm giá', `Mã ${p.code} hiện áp dụng được.`);
        } else {
          showToast('info', 'Đã tắt mã giảm giá', `Mã ${p.code} hiện ngừng áp dụng.`);
        }
        return { ...p, active: newActive };
      }
      return p;
    }));
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
          <button className="btn btn--primary" onClick={() => setEditingPromo('new')}>
            <Plus size={18} /> Tạo mã giảm giá
          </button>
        </div>
      </div>
      <div className="promo-grid">
        {promos.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <strong>Chưa có mã giảm giá</strong>
              <p>Tạo mã đầu tiên để thu hút khách hàng quay lại mua sắm.</p>
            </div>
          </div>
        ) : (
          promos.map(pr => {
            const pct = Math.min(100, Math.round((pr.used / pr.limit) * 100));
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
                    <span>Đã dùng {pr.used}/{pr.limit}</span>
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
                    <button className="icon-btn icon-btn--sm" title="Sửa" onClick={() => setEditingPromo(pr)}><Pencil size={16} /></button>
                    <button className="icon-btn icon-btn--sm" title="Xóa" onClick={() => {
                      if (window.confirm(`Xóa mã giảm giá ${pr.code}?`)) {
                        setPromos(promos.filter(x => x.id !== pr.id));
                        showToast('success', 'Đã xóa mã giảm giá', `Mã ${pr.code} đã được gỡ bỏ.`);
                      }
                    }}><Trash2 size={16} /></button>
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
            <button className="btn btn--primary" onClick={handleSave}>{editingPromo === 'new' ? 'Tạo mã mới' : 'Lưu thay đổi'}</button>
          </div>
        }
      >
        <form className="form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="form-row">
            <label className="field">
              <span>Mã code *</span>
              <input className="input" style={{ textTransform: 'uppercase' }} defaultValue={editingPromo !== 'new' && editingPromo ? editingPromo.code : ''} placeholder="VD: SALE50" />
            </label>
            <label className="field">
              <span>Loại giảm giá</span>
              <select className="select select--full" defaultValue={editingPromo !== 'new' && editingPromo ? editingPromo.type : 'percent'}>
                <option value="percent">Theo phần trăm (%)</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              <span>Giá trị giảm *</span>
              <input className="input" type="number" defaultValue={editingPromo !== 'new' && editingPromo ? editingPromo.value : ''} placeholder="VD: 20" />
            </label>
            <label className="field">
              <span>Đơn tối thiểu</span>
              <input className="input" type="number" defaultValue={editingPromo !== 'new' && editingPromo ? editingPromo.minOrder : ''} placeholder="VD: 200000" />
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              <span>Giới hạn sử dụng</span>
              <input className="input" type="number" defaultValue={editingPromo !== 'new' && editingPromo ? editingPromo.limit : ''} placeholder="VD: 500" />
            </label>
            <label className="field">
              <span>Ngày hết hạn *</span>
              <input className="input" type="date" defaultValue={editingPromo !== 'new' && editingPromo ? editingPromo.end.split("T")[0] : ''} />
            </label>
          </div>
          <label className="field">
            <span>Mô tả ngắn</span>
            <input className="input" defaultValue={editingPromo !== 'new' && editingPromo ? editingPromo.desc : ''} placeholder="VD: Ưu đãi hè cho mọi đơn hàng" />
          </label>
        </form>
      </Modal>
    </section>
  );
}
