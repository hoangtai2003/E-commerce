import { useEffect, useMemo, useState } from 'react';
import {
  Download, Plus, Wallet, ShoppingBag, Users, PackageX,
  ArrowUpRight, ArrowDownRight, WifiOff, RefreshCw,
  ShoppingCart, Truck, CheckCircle, Undo2, SlidersHorizontal
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useToast } from '../contexts/ToastContext';
import { getOrders, type ApiOrder } from '../services/orders';
import { getCustomers } from '../services/customers';
import { getProducts, type ApiProduct } from '../services/products';
import { getProductVariants, type ApiProductVariant } from '../services/productVariants';
import { getCategories } from '../services/categories';
import { getInventoryMovements, type ApiInventoryMovement, type MovementType } from '../services/inventory';
import type { Customer, Category } from '../types';

// Hàm helper format tiền tệ
const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";
const fmtCompact = (n: number) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

// Hàm helper format ngày giờ
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtRelative = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  return `${day} ngày trước`;
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d: Date) => { const s = startOfDay(d); const day = (s.getDay() + 6) % 7; s.setDate(s.getDate() - day); return s; };
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const ORDER_STATUS: Record<string, { label: string, tone: string, grad: string }> = {
  pending: { label: "Chờ xử lý", tone: "warning", grad: "var(--grad-amber)" },
  shipping: { label: "Đang giao", tone: "info", grad: "var(--grad-teal)" },
  completed: { label: "Hoàn thành", tone: "success", grad: "var(--grad-primary)" },
  cancelled: { label: "Đã hủy", tone: "danger", grad: "var(--grad-rose)" },
};

const MOVEMENT_LABEL: Record<MovementType, { verb: string; icon: React.ElementType; tone: string }> = {
  sale: { verb: "Bán", icon: ShoppingCart, tone: "primary" },
  purchase: { verb: "Nhập kho", icon: Truck, tone: "info" },
  return: { verb: "Khách trả", icon: Undo2, tone: "warning" },
  adjustment: { verb: "Điều chỉnh kho", icon: SlidersHorizontal, tone: "info" },
  supplier_return: { verb: "Trả hàng NCC", icon: Undo2, tone: "danger" },
};
const DEFAULT_MOVEMENT_LABEL = { verb: "Cập nhật kho", icon: CheckCircle, tone: "info" };

// Chia doanh thu theo mốc thời gian (ngày/tuần/tháng) dựa trên đơn hàng thật
function buildRevenueSeries(orders: ApiOrder[], period: 'day' | 'week' | 'month') {
  const buckets = period === 'day' ? 7 : period === 'week' ? 8 : 6;
  const now = new Date();
  const points: { key: number; name: string; revenue: number; orders: number }[] = [];

  for (let i = buckets - 1; i >= 0; i--) {
    let start: Date, name: string;
    if (period === 'day') {
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      name = start.toLocaleDateString('vi-VN', { weekday: 'short' });
    } else if (period === 'week') {
      start = startOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7));
      name = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } else {
      start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
      name = `Thg ${start.getMonth() + 1}`;
    }
    points.push({ key: start.getTime(), name, revenue: 0, orders: 0 });
  }

  const bucketEnd = (idx: number) => {
    if (period === 'day') return points[idx].key + 86400000;
    if (period === 'week') return points[idx].key + 7 * 86400000;
    const d = new Date(points[idx].key);
    return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  };

  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    const t = new Date(o.ordered_at).getTime();
    const idx = points.findIndex((p, i) => t >= p.key && t < bucketEnd(i));
    if (idx >= 0) {
      points[idx].revenue += o.total;
      points[idx].orders += 1;
    }
  });

  return points;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [variants, setVariants] = useState<ApiProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [movements, setMovements] = useState<ApiInventoryMovement[]>([]);
  const [activityFailed, setActivityFailed] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getCustomers(), getProducts(), getProductVariants(), getCategories()])
      .then(([o, c, p, v, cat]) => {
        setOrders(o);
        setCustomers(c);
        setProducts(p);
        setVariants(v);
        setCategories(cat);
      })
      .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải dữ liệu tổng quan từ máy chủ.'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const loadActivity = () => {
    setActivityLoading(true);
    setActivityFailed(false);
    getInventoryMovements()
      .then(setMovements)
      .catch(() => setActivityFailed(true))
      .finally(() => setActivityLoading(false));
  };

  useEffect(() => { loadActivity(); }, []);

  // Map tra cứu nhanh: variant -> product -> category
  const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const variantById = useMemo(() => new Map(variants.map(v => [v.id, v])), [variants]);
  const categoryById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const customerById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

  const productNameOfVariant = (variantId: number) => {
    const v = variantById.get(variantId);
    const p = v ? productById.get(v.product) : undefined;
    return p?.name ?? v?.variant_name ?? 'Sản phẩm đã xoá';
  };

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
  const monthStart = startOfMonth(now);

  const kpis = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const thisWeek = validOrders.filter(o => new Date(o.ordered_at) >= weekAgo);
    const lastWeek = validOrders.filter(o => { const t = new Date(o.ordered_at); return t >= twoWeeksAgo && t < weekAgo; });

    const revThis = thisWeek.reduce((s, o) => s + o.total, 0);
    const revLast = lastWeek.reduce((s, o) => s + o.total, 0);
    const revTrend = revLast === 0 ? (revThis > 0 ? 100 : 0) : ((revThis - revLast) / revLast) * 100;

    const ordersTrend = lastWeek.length === 0 ? (thisWeek.length > 0 ? 100 : 0) : ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100;

    const pending = orders.filter(o => o.status === 'pending').length;
    const newThisMonth = customers.filter(c => new Date(c.joined) >= monthStart).length;
    const lowStock = variants.filter(v => v.variant_status === 'low' || v.variant_status === 'out').length;

    return [
      { hero: true, label: "Doanh thu tuần này", value: fmtMoney(revThis), icon: Wallet, trend: `${revTrend >= 0 ? '+' : ''}${revTrend.toFixed(1)}%`, up: revTrend >= 0, meta: "so với tuần trước" },
      { label: "Đơn hàng", value: orders.length.toLocaleString("vi-VN"), icon: ShoppingBag, grad: "var(--grad-teal)", trend: `${ordersTrend >= 0 ? '+' : ''}${ordersTrend.toFixed(1)}%`, up: ordersTrend >= 0, meta: `${pending} đơn chờ xử lý` },
      { label: "Khách hàng", value: customers.length.toLocaleString("vi-VN"), icon: Users, grad: "var(--grad-amber)", trend: `+${newThisMonth}`, up: true, meta: "khách mới tháng này" },
      { label: "Cảnh báo tồn kho", value: lowStock.toLocaleString("vi-VN"), icon: PackageX, grad: "var(--grad-rose)", meta: "sản phẩm sắp hết / hết hàng" },
    ];
  }, [orders, customers, variants]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentRevenueData = useMemo(() => buildRevenueSeries(orders, revenuePeriod), [orders, revenuePeriod]);

  const palette = ["#5D5FEF", "#14B8A6", "#F59E0B", "#F43F5E", "#8B5CF6", "#94A3B8"];

  const categoryRevenue = useMemo(() => {
    const totals = new Map<number, number>(); // categoryId -> tổng line_total
    let grand = 0;
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      o.items.forEach(it => {
        const v = variantById.get(it.variant);
        const p = v ? productById.get(v.product) : undefined;
        const catId = p?.category ?? 0;
        totals.set(catId, (totals.get(catId) ?? 0) + it.line_total);
        grand += it.line_total;
      });
    });
    if (grand === 0) return [];
    return Array.from(totals.entries())
      .map(([catId, amount]) => ({
        label: categoryById.get(catId)?.name ?? 'Khác',
        value: Math.round((amount / grand) * 1000) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [orders, variantById, productById, categoryById]);

  const topProducts = useMemo(() => {
    const sold = new Map<number, number>(); // productId -> tổng số lượng bán
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      o.items.forEach(it => {
        const v = variantById.get(it.variant);
        if (!v) return;
        sold.set(v.product, (sold.get(v.product) ?? 0) + it.quantity);
      });
    });
    return Array.from(sold.entries())
      .map(([productId, qty]) => ({ product: productById.get(productId), sold: qty }))
      .filter(x => x.product)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5) as { product: ApiProduct; sold: number }[];
  }, [orders, variantById, productById]);
  const maxSold = topProducts[0]?.sold || 1;

  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => b.ordered_at.localeCompare(a.ordered_at)).slice(0, 5),
    [orders]);

  return (
    <section className="page active" id="page-dashboard" data-title="Dashboard">
      <div className="page-head">
        <div>
          <h1>Chào buổi sáng 👋</h1>
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
        {loading ? (
          <p>Đang tải…</p>
        ) : kpis.map((k, i) => (
          <article key={i} className={`kpi ${k.hero ? "kpi--hero" : ""}`}>
            <div className="kpi__top">
              <span className="kpi__label">{k.label}</span>
              <span className="kpi__icon" style={!k.hero ? { background: k.grad } : {}}>
                <k.icon size={20} />
              </span>
            </div>
            <div className="kpi__value">{k.value}</div>
            <div className="kpi__meta">
              {k.trend && (
                <span className={`trend ${k.up ? "trend--up" : "trend--down"}`}>
                  {k.up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}{k.trend}
                </span>
              )}
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
                    <stop offset="5%" stopColor="#5D5FEF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5D5FEF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 12 }} tickFormatter={fmtCompact} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                  formatter={(value: any) => [fmtMoney(Number(value)), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#5D5FEF" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <div className="card__head">
            <div>
              <h3>Doanh thu theo danh mục</h3>
              <p className="card__sub">Tỷ trọng theo đơn hàng hiện có</p>
            </div>
          </div>
          {categoryRevenue.length === 0 ? (
            <p className="card__sub" style={{ padding: '24px 0', textAlign: 'center' }}>Chưa có đơn hàng nào để thống kê.</p>
          ) : (
            <>
              <div className="chart-wrap chart-wrap--doughnut" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryRevenue}
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryRevenue.map((_entry, index) => (
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
                {categoryRevenue.map((c, i) => (
                  <span key={i} className="legend__item">
                    <span className="legend__swatch" style={{ background: palette[i % palette.length] }}></span>{c.label} · {c.value}%
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card__head">
            <h3>Sản phẩm bán chạy</h3>
            <Link to="/products" className="link-btn">Xem tất cả</Link>
          </div>
          <div className="top-products">
            {topProducts.length === 0 ? (
              <p className="card__sub">Chưa có sản phẩm nào được bán.</p>
            ) : topProducts.map(({ product, sold }) => (
              <div key={product.id} className="top-product">
                <div className="top-product__thumb" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  {initials(product.name)}
                </div>
                <div className="top-product__info">
                  <strong>{product.name}</strong>
                  <div className="top-product__bar">
                    <span style={{ width: `${Math.round((sold / maxSold) * 100)}%` }}></span>
                  </div>
                </div>
                <span className="top-product__sold">{sold} đã bán</span>
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
            {recentOrders.length === 0 ? (
              <p className="card__sub">Chưa có đơn hàng nào.</p>
            ) : recentOrders.map(o => {
              const c = o.customer !== null ? customerById.get(o.customer) : undefined;
              const s = ORDER_STATUS[o.status];
              return (
                <div key={o.id} className="mini-order" onClick={() => navigate(`/orders?id=${o.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="avatar avatar--sm" style={{ background: s.grad }}>{initials(c?.name || "Khách vãng lai")}</div>
                  <div className="mini-order__info">
                    <strong>{o.code}</strong>
                    <span>{c?.name ?? "Khách vãng lai"} · {fmtDate(o.ordered_at)}</span>
                  </div>
                  <div>
                    <div className="mini-order__amount">{fmtMoney(o.total)}</div>
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
            <button className="icon-btn icon-btn--sm" title="Tải lại" onClick={loadActivity}>
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="activity">
            {activityLoading ? (
              <p className="card__sub">Đang tải…</p>
            ) : activityFailed ? (
              <div className="error-state">
                <div className="error-state__icon"><WifiOff size={24} /></div>
                <strong>Không tải được dữ liệu</strong>
                <p>Kết nối tới máy chủ hoạt động bị gián đoạn. Vui lòng thử lại.</p>
                <button className="btn btn--ghost btn--sm" onClick={loadActivity}>
                  <RefreshCw size={16} /> Thử lại
                </button>
              </div>
            ) : movements.length === 0 ? (
              <p className="card__sub">Chưa có hoạt động kho nào.</p>
            ) : (
              movements.slice(0, 8).map((m) => {
                const meta = MOVEMENT_LABEL[m.movement_type] ?? DEFAULT_MOVEMENT_LABEL;
                const tones: Record<string, [string, string]> = {
                  primary: ["var(--primary-soft)", "var(--primary)"],
                  info: ["var(--info-soft)", "var(--info)"],
                  success: ["var(--success-soft)", "var(--success)"],
                  warning: ["var(--warning-soft)", "var(--warning)"],
                  danger: ["var(--danger-soft)", "var(--danger)"]
                };
                const [bg, fg] = tones[meta.tone] || tones.info;
                const IconComp = meta.icon || CheckCircle;
                return (
                  <div key={m.id} className="activity-item">
                    <div className="activity-item__dot" style={{ background: bg, color: fg }}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <p><strong>{meta.verb}</strong> {Math.abs(m.quantity)} × {productNameOfVariant(m.variant)}</p>
                      <time>{fmtRelative(m.created_at)}</time>
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
