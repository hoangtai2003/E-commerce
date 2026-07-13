import { useState } from 'react';
import { 
  Download, Plus, Wallet, ShoppingBag, Users, PackageX, 
  ArrowUpRight, ArrowDownRight, WifiOff, RefreshCw,
  ShoppingCart, Truck, CheckCircle, Package, XCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  mockOrders, mockProducts, mockCustomers, REVENUE_DATA, CATEGORY_REVENUE, ACTIVITY_FEED 
} from '../data/mock';
import { useToast } from '../contexts/ToastContext';

// Hàm helper format tiền tệ
const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

// Hàm helper format ngày giờ
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

const orderTotal = (order: typeof mockOrders[0]) =>
  order.items.reduce((sum, it) => {
    const p = mockProducts.find((x) => x.id === it.productId);
    return sum + (p ? p.price * it.qty : 0);
  }, 0);

const ORDER_STATUS: Record<string, { label: string, tone: string, grad: string }> = {
  pending: { label: "Chờ xử lý", tone: "warning", grad: "var(--grad-amber)" },
  shipping: { label: "Đang giao", tone: "info", grad: "var(--grad-teal)" },
  completed: { label: "Hoàn thành", tone: "success", grad: "var(--grad-primary)" },
  cancelled: { label: "Đã hủy", tone: "danger", grad: "var(--grad-rose)" },
};

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, Truck, CheckCircle, Package, XCircle
};

export function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month'>('day');
  const [activityFailed, setActivityFailed] = useState(true); // Demo error state ban đầu
  
  const totalRevenue = mockOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + orderTotal(o), 0);
  const totalOrders = mockOrders.length;
  const pending = mockOrders.filter(o => o.status === "pending").length;
  const customersCount = mockCustomers.length;
  const lowStock = mockProducts.filter(p => p.status === "low" || p.status === "out").length;

  const kpis = [
    { hero: true, label: "Doanh thu tuần này", value: fmtMoney(totalRevenue), icon: Wallet, trend: "+18,2%", up: true, meta: "so với tuần trước" },
    { label: "Đơn hàng", value: totalOrders.toLocaleString("vi-VN"), icon: ShoppingBag, grad: "var(--grad-teal)", trend: "+9,4%", up: true, meta: `${pending} đơn chờ xử lý` },
    { label: "Khách hàng", value: customersCount.toLocaleString("vi-VN"), icon: Users, grad: "var(--grad-amber)", trend: "+3,1%", up: true, meta: "4 khách mới tháng này" },
    { label: "Cảnh báo tồn kho", value: lowStock.toLocaleString("vi-VN"), icon: PackageX, grad: "var(--grad-rose)", trend: "-2", up: false, meta: "sản phẩm sắp hết / hết hàng" },
  ];

  // Chuẩn bị dữ liệu cho Recharts (Line/Area chart)
  const currentRevenueData = REVENUE_DATA[revenuePeriod].labels.map((label, idx) => ({
    name: label,
    revenue: REVENUE_DATA[revenuePeriod].revenue[idx],
    orders: REVENUE_DATA[revenuePeriod].orders[idx],
  }));

  const palette = ["#5D5FEF", "#14B8A6", "#F59E0B", "#F43F5E", "#8B5CF6"];

  const topProducts = [...mockProducts].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const maxSold = topProducts[0]?.sold || 1;

  const recentOrders = [...mockOrders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <section className="page active" id="page-dashboard" data-title="Dashboard">
      <div className="page-head">
        <div>
          <h1>Chào buổi sáng, Minh 👋</h1>
          <p className="page-sub">Đây là bức tranh kinh doanh của cửa hàng hôm nay.</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--ghost" onClick={() => showToast('info', 'Đang chuẩn bị báo cáo...', 'Tệp PDF sẽ được gửi tới email của bạn (demo).')}>
            <Download size={18} /> Xuất báo cáo
          </button>
          <button className="btn btn--primary" onClick={() => navigate('/products')}>
            <Plus size={18} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <article key={i} className={`kpi ${k.hero ? "kpi--hero" : ""}`}>
            <div className="kpi__top">
              <span className="kpi__label">{k.label}</span>
              <span className="kpi__icon" style={!k.hero ? { background: k.grad } : {}}>
                <k.icon size={20} />
              </span>
            </div>
            <div className="kpi__value">{k.value}</div>
            <div className="kpi__meta">
              <span className={`trend ${k.up ? "trend--up" : "trend--down"}`}>
                {k.up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}{k.trend}
              </span>
              <span>{k.meta}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid-2-1">
        <div className="card chart-card">
          <div className="card__head">
            <div>
              <h3>Doanh thu</h3>
              <p className="card__sub">Theo dõi dòng tiền theo thời gian</p>
            </div>
            <div className="seg">
              <button className={`seg__btn ${revenuePeriod === 'day' ? 'active' : ''}`} onClick={() => setRevenuePeriod('day')}>Ngày</button>
              <button className={`seg__btn ${revenuePeriod === 'week' ? 'active' : ''}`} onClick={() => setRevenuePeriod('week')}>Tuần</button>
              <button className={`seg__btn ${revenuePeriod === 'month' ? 'active' : ''}`} onClick={() => setRevenuePeriod('month')}>Tháng</button>
            </div>
          </div>
          <div className="chart-wrap" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5D5FEF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5D5FEF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-3)', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-3)', fontSize: 12}} tickFormatter={(val) => val + 'tr'} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Area type="monotone" dataKey="revenue" name="Doanh thu (triệu ₫)" stroke="#5D5FEF" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="card__head">
            <div>
              <h3>Doanh thu theo danh mục</h3>
              <p className="card__sub">Tỷ trọng 30 ngày qua</p>
            </div>
          </div>
          <div className="chart-wrap chart-wrap--doughnut" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_REVENUE}
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {CATEGORY_REVENUE.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Tỷ trọng'] as [string, string]}
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {CATEGORY_REVENUE.map((c, i) => (
              <span key={i} className="legend__item">
                <span className="legend__swatch" style={{ background: palette[i] }}></span>{c.label} · {c.value}%
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card__head">
            <h3>Sản phẩm bán chạy</h3>
            <Link to="/products" className="link-btn">Xem tất cả</Link>
          </div>
          <div className="top-products">
            {topProducts.map(p => (
              <div key={p.id} className="top-product">
                <div className="top-product__thumb" style={{ background: p.tint }}>{p.emoji}</div>
                <div className="top-product__info">
                  <strong>{p.name}</strong>
                  <div className="top-product__bar">
                    <span style={{ width: `${Math.round((p.sold / maxSold) * 100)}%` }}></span>
                  </div>
                </div>
                <span className="top-product__sold">{p.sold} đã bán</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <h3>Đơn hàng gần đây</h3>
            <Link to="/orders" className="link-btn">Xem tất cả</Link>
          </div>
          <div className="mini-orders">
            {recentOrders.map(o => {
              const c = mockCustomers.find((x) => x.id === o.customerId);
              const s = ORDER_STATUS[o.status];
              return (
                <div key={o.id} className="mini-order" onClick={() => navigate(`/orders?id=${o.id}`)} style={{cursor: 'pointer'}}>
                  <div className="avatar avatar--sm" style={{ background: s.grad }}>{initials(c?.name || "Khách hàng")}</div>
                  <div className="mini-order__info">
                    <strong>{o.code}</strong>
                    <span>{c?.name} · {fmtDate(o.date)}</span>
                  </div>
                  <div>
                    <div className="mini-order__amount">{fmtMoney(orderTotal(o))}</div>
                    <span className={`badge badge--${s.tone}`} style={{ marginTop: 3 }}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <h3>Hoạt động gần đây</h3>
            <button className="icon-btn icon-btn--sm" title="Tải lại" onClick={() => setActivityFailed(false)}>
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="activity">
            {activityFailed ? (
              <div className="error-state">
                <div className="error-state__icon"><WifiOff size={24} /></div>
                <strong>Không tải được dữ liệu</strong>
                <p>Kết nối tới máy chủ hoạt động bị gián đoạn. Vui lòng thử lại.</p>
                <button className="btn btn--ghost btn--sm" onClick={() => setActivityFailed(false)}>
                  <RefreshCw size={16} /> Thử lại
                </button>
              </div>
            ) : (
              ACTIVITY_FEED.map((a, i) => {
                const tones: Record<string, [string, string]> = { 
                  primary: ["var(--primary-soft)", "var(--primary)"], 
                  info: ["var(--info-soft)", "var(--info)"], 
                  success: ["var(--success-soft)", "var(--success)"], 
                  warning: ["var(--warning-soft)", "var(--warning)"], 
                  danger: ["var(--danger-soft)", "var(--danger)"] 
                };
                const [bg, fg] = tones[a.tone] || tones.info;
                const IconComp = iconMap[a.icon] || CheckCircle;
                return (
                  <div key={i} className="activity-item">
                    <div className="activity-item__dot" style={{ background: bg, color: fg }}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <p dangerouslySetInnerHTML={{ __html: a.html }}></p>
                      <time>{a.time}</time>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
