import { useState } from 'react';
import { Plus, Copy, Pencil, Trash2 } from 'lucide-react';
import { mockPromos } from '../data/mock';
import type { Promo } from '../types';
import { useToast } from '../contexts/ToastContext';

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

export function Promos() {
  const { showToast } = useToast();
  const [promos, setPromos] = useState<Promo[]>(mockPromos);

  const togglePromo = (id: number) => {
    setPromos(promos.map(p => p.id === id ? { ...p, active: !p.active } : p));
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
          <button className="btn btn--primary" onClick={() => showToast('info', 'Chức năng sẽ sớm ra mắt')}>
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
                    <button className="icon-btn icon-btn--sm" title="Sửa"><Pencil size={16} /></button>
                    <button className="icon-btn icon-btn--sm" title="Xóa"><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
