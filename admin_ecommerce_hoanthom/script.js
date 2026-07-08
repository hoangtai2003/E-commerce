/* ============================================================
   AURORA ADMIN — script.js (Vanilla JS)
   Cấu trúc module:
   1. MOCK DATA        — dữ liệu mẫu viết cứng
   2. HELPERS          — hàm tiện ích chung
   3. STATE            — trạng thái ứng dụng
   4. TOAST & MODAL    — thông báo và hộp thoại
   5. LAYOUT           — sidebar, topbar, dropdown, theme
   6. ROUTER           — chuyển trang + skeleton loading
   7. DASHBOARD        — KPI, biểu đồ, danh sách
   8. PRODUCTS         — CRUD sản phẩm
   9. ORDERS           — quản lý đơn hàng
   10. CUSTOMERS       — khách hàng
   11. PROMOS          — khuyến mãi
   12. STAFF           — nhân viên & phân quyền
   13. SETTINGS        — cài đặt
   14. INIT            — khởi động ứng dụng
   ============================================================ */

"use strict";

/* ============ 1. MOCK DATA ============ */

const CATEGORIES = ["Thời trang", "Công nghệ", "Phụ kiện", "Mỹ phẩm", "Gia dụng"];

// Emoji + màu nền pastel dùng làm "ảnh" sản phẩm (không cần ảnh thật)
const seedProducts = () => ([
  { id: 1,  name: "Tai nghe không dây Pulse X", sku: "TN-PULSE-X",  category: "Công nghệ",  price: 1290000, stock: 84,  sold: 512, status: "active", emoji: "🎧", tint: "#EDEBFF", variants: [{ label: "Đen", stock: 40 }, { label: "Trắng", stock: 30 }, { label: "Xanh navy", stock: 14 }] },
  { id: 2,  name: "Giày sneaker Cloudstep",      sku: "GD-CLOUD-01", category: "Thời trang", price: 890000,  stock: 12,  sold: 431, status: "low",    emoji: "👟", tint: "#E4F6F1", variants: [{ label: "38 / Trắng", stock: 4 }, { label: "39 / Trắng", stock: 3 }, { label: "40 / Đen", stock: 5 }] },
  { id: 3,  name: "Áo thun cotton Basic Tee",    sku: "AT-BASIC-22", category: "Thời trang", price: 199000,  stock: 230, sold: 389, status: "active", emoji: "👕", tint: "#FFF1E4", variants: [{ label: "S / Trắng", stock: 60 }, { label: "M / Đen", stock: 90 }, { label: "L / Xám", stock: 80 }] },
  { id: 4,  name: "Đồng hồ thông minh Nova S2",  sku: "DH-NOVA-S2",  category: "Công nghệ",  price: 2450000, stock: 0,   sold: 356, status: "out",    emoji: "⌚", tint: "#E8F0FE", variants: [{ label: "Dây silicon", stock: 0 }, { label: "Dây da", stock: 0 }] },
  { id: 5,  name: "Balo chống nước UrbanPack",   sku: "BL-URBAN-9",  category: "Phụ kiện",   price: 560000,  stock: 47,  sold: 298, status: "active", emoji: "🎒", tint: "#FDEBF1", variants: [{ label: "20L / Đen", stock: 25 }, { label: "26L / Xám", stock: 22 }] },
  { id: 6,  name: "Bàn phím cơ Keychron K2",     sku: "BP-KEY-K2",   category: "Công nghệ",  price: 1850000, stock: 31,  sold: 245, status: "active", emoji: "⌨️", tint: "#EAF7E6", variants: [{ label: "Red switch", stock: 15 }, { label: "Brown switch", stock: 16 }] },
  { id: 7,  name: "Son kem lì Velvet Rose",      sku: "SK-VEL-04",   category: "Mỹ phẩm",    price: 245000,  stock: 8,   sold: 233, status: "low",    emoji: "💄", tint: "#FFE9EC", variants: [{ label: "04 Đỏ gạch", stock: 3 }, { label: "07 Hồng đất", stock: 5 }] },
  { id: 8,  name: "Chuột không dây Glide Pro",   sku: "CH-GLIDE-P",  category: "Công nghệ",  price: 690000,  stock: 66,  sold: 187, status: "active", emoji: "🖱️", tint: "#EDEBFF", variants: [{ label: "Đen", stock: 40 }, { label: "Trắng", stock: 26 }] },
  { id: 9,  name: "Nến thơm Lavender Calm",      sku: "NT-LAV-30",   category: "Gia dụng",   price: 185000,  stock: 120, sold: 164, status: "active", emoji: "🕯️", tint: "#F3ECFF", variants: [{ label: "200g", stock: 70 }, { label: "350g", stock: 50 }] },
  { id: 10, name: "Kem dưỡng ẩm HydraGlow",      sku: "KD-HYD-50",   category: "Mỹ phẩm",    price: 320000,  stock: 55,  sold: 142, status: "active", emoji: "🧴", tint: "#E4F6F1", variants: [{ label: "50ml", stock: 35 }, { label: "100ml", stock: 20 }] },
  { id: 11, name: "Túi tote canvas Daily",       sku: "TT-CANV-01",  category: "Phụ kiện",   price: 150000,  stock: 0,   sold: 121, status: "hidden", emoji: "👜", tint: "#FFF6DE", variants: [{ label: "Kem", stock: 0 }, { label: "Đen", stock: 0 }] },
  { id: 12, name: "Máy xay sinh tố MiniBlend",   sku: "MX-BLEND-3",  category: "Gia dụng",   price: 430000,  stock: 27,  sold: 96,  status: "active", emoji: "🥤", tint: "#E8F0FE", variants: [{ label: "300ml", stock: 15 }, { label: "500ml", stock: 12 }] },
]);

const seedCustomers = () => ([
  { id: 1,  name: "Nguyễn Thu Hà",    email: "ha.nguyen@gmail.com",   phone: "0912 345 678", joined: "2024-03-12", orders: 24, spent: 18450000, tier: "vip" },
  { id: 2,  name: "Trần Quốc Bảo",    email: "baotran@outlook.com",   phone: "0987 654 321", joined: "2024-06-02", orders: 15, spent: 9820000,  tier: "loyal" },
  { id: 3,  name: "Lê Minh Anh",      email: "minhanh.le@gmail.com",  phone: "0905 111 222", joined: "2024-08-19", orders: 11, spent: 7640000,  tier: "loyal" },
  { id: 4,  name: "Phạm Hồng Nhung",  email: "nhungph@gmail.com",     phone: "0938 777 999", joined: "2025-01-25", orders: 19, spent: 15200000, tier: "vip" },
  { id: 5,  name: "Hoàng Văn Dũng",   email: "dunghoang@yahoo.com",   phone: "0977 888 111", joined: "2025-04-08", orders: 6,  spent: 3120000,  tier: "loyal" },
  { id: 6,  name: "Vũ Thị Lan",       email: "lanvu.90@gmail.com",    phone: "0966 234 567", joined: "2025-09-14", orders: 4,  spent: 2350000,  tier: "new" },
  { id: 7,  name: "Đặng Tuấn Kiệt",   email: "kietdang@gmail.com",    phone: "0944 555 666", joined: "2025-11-30", orders: 3,  spent: 4890000,  tier: "new" },
  { id: 8,  name: "Bùi Ngọc Mai",     email: "maibn@icloud.com",      phone: "0921 333 444", joined: "2026-02-11", orders: 2,  spent: 1580000,  tier: "new" },
  { id: 9,  name: "Đỗ Hải Nam",       email: "namdo.dev@gmail.com",   phone: "0909 090 909", joined: "2026-03-27", orders: 5,  spent: 6740000,  tier: "loyal" },
  { id: 10, name: "Ngô Phương Linh",  email: "linhngo@gmail.com",     phone: "0888 123 456", joined: "2026-06-03", orders: 1,  spent: 890000,   tier: "new" },
]);

const seedOrders = () => ([
  { id: 1,  code: "AUR-2607", customerId: 1,  date: "2026-07-07T08:42", payment: "Ví MoMo",       status: "pending",   items: [{ productId: 1, variant: "Đen", qty: 1 }, { productId: 7, variant: "04 Đỏ gạch", qty: 2 }] },
  { id: 2,  code: "AUR-2606", customerId: 6,  date: "2026-07-07T07:15", payment: "COD",           status: "pending",   items: [{ productId: 3, variant: "M / Đen", qty: 3 }] },
  { id: 3,  code: "AUR-2605", customerId: 4,  date: "2026-07-06T21:03", payment: "Chuyển khoản",  status: "pending",   items: [{ productId: 6, variant: "Brown switch", qty: 1 }, { productId: 8, variant: "Trắng", qty: 1 }] },
  { id: 4,  code: "AUR-2604", customerId: 2,  date: "2026-07-06T18:37", payment: "Thẻ tín dụng",  status: "shipping",  items: [{ productId: 2, variant: "39 / Trắng", qty: 1 }] },
  { id: 5,  code: "AUR-2603", customerId: 9,  date: "2026-07-06T14:20", payment: "Ví MoMo",       status: "shipping",  items: [{ productId: 5, variant: "26L / Xám", qty: 1 }, { productId: 9, variant: "350g", qty: 2 }] },
  { id: 6,  code: "AUR-2602", customerId: 3,  date: "2026-07-06T10:55", payment: "COD",           status: "shipping",  items: [{ productId: 10, variant: "50ml", qty: 2 }] },
  { id: 7,  code: "AUR-2601", customerId: 7,  date: "2026-07-05T19:48", payment: "Chuyển khoản",  status: "completed", items: [{ productId: 4, variant: "Dây da", qty: 1 }, { productId: 12, variant: "500ml", qty: 1 }] },
  { id: 8,  code: "AUR-2600", customerId: 5,  date: "2026-07-05T16:12", payment: "COD",           status: "completed", items: [{ productId: 3, variant: "L / Xám", qty: 2 }, { productId: 11, variant: "Kem", qty: 1 }] },
  { id: 9,  code: "AUR-2599", customerId: 1,  date: "2026-07-05T09:30", payment: "Thẻ tín dụng",  status: "completed", items: [{ productId: 1, variant: "Trắng", qty: 2 }] },
  { id: 10, code: "AUR-2598", customerId: 8,  date: "2026-07-04T20:05", payment: "Ví MoMo",       status: "completed", items: [{ productId: 9, variant: "200g", qty: 3 }, { productId: 7, variant: "07 Hồng đất", qty: 1 }] },
  { id: 11, code: "AUR-2597", customerId: 10, date: "2026-07-04T15:44", payment: "COD",           status: "cancelled", items: [{ productId: 2, variant: "40 / Đen", qty: 1 }] },
  { id: 12, code: "AUR-2596", customerId: 4,  date: "2026-07-04T11:28", payment: "Chuyển khoản",  status: "completed", items: [{ productId: 6, variant: "Red switch", qty: 1 }] },
  { id: 13, code: "AUR-2595", customerId: 2,  date: "2026-07-03T22:19", payment: "Ví MoMo",       status: "completed", items: [{ productId: 8, variant: "Đen", qty: 1 }, { productId: 5, variant: "20L / Đen", qty: 1 }] },
  { id: 14, code: "AUR-2594", customerId: 9,  date: "2026-07-03T13:52", payment: "COD",           status: "cancelled", items: [{ productId: 12, variant: "300ml", qty: 2 }] },
  { id: 15, code: "AUR-2593", customerId: 3,  date: "2026-07-03T08:06", payment: "Thẻ tín dụng",  status: "completed", items: [{ productId: 10, variant: "100ml", qty: 1 }, { productId: 3, variant: "S / Trắng", qty: 2 }] },
]);

const seedPromos = () => ([
  { id: 1, code: "SUMMER26",   type: "percent", value: 20, minOrder: 500000,  used: 342, limit: 500,  end: "2026-08-31", active: true,  desc: "Ưu đãi hè cho mọi đơn hàng" },
  { id: 2, code: "FREESHIP99", type: "fixed",   value: 30000, minOrder: 99000, used: 875, limit: 1000, end: "2026-12-31", active: true,  desc: "Hỗ trợ phí vận chuyển toàn quốc" },
  { id: 3, code: "VIPONLY",    type: "percent", value: 15, minOrder: 1000000, used: 58,  limit: 200,  end: "2026-09-15", active: true,  desc: "Dành riêng khách hàng hạng VIP" },
  { id: 4, code: "NEWBIE50",   type: "fixed",   value: 50000, minOrder: 200000, used: 421, limit: 600, end: "2026-07-31", active: true,  desc: "Chào mừng khách hàng mới" },
  { id: 5, code: "TET2026",    type: "percent", value: 30, minOrder: 800000,  used: 500, limit: 500,  end: "2026-02-10", active: false, desc: "Đã kết thúc dịp Tết Nguyên đán" },
  { id: 6, code: "FLASH12H",   type: "percent", value: 25, minOrder: 300000,  used: 96,  limit: 300,  end: "2026-07-12", active: true,  desc: "Flash sale cuối tuần, số lượng có hạn" },
]);

const ROLES = {
  admin:   { name: "Quản trị viên", icon: "crown",       grad: "var(--grad-primary)", desc: "Toàn quyền hệ thống" },
  manager: { name: "Quản lý",       icon: "briefcase",   grad: "var(--grad-teal)",    desc: "Quản lý vận hành, không sửa cài đặt" },
  staff:   { name: "Nhân viên",     icon: "user",        grad: "var(--grad-amber)",   desc: "Xử lý đơn hàng và kho" },
};

const PERM_MODULES = ["Sản phẩm", "Đơn hàng", "Khách hàng", "Khuyến mãi"];
const ROLE_PERMS = {
  admin:   { "Sản phẩm": ["view", "create", "edit", "delete"], "Đơn hàng": ["view", "create", "edit", "delete"], "Khách hàng": ["view", "create", "edit", "delete"], "Khuyến mãi": ["view", "create", "edit", "delete"] },
  manager: { "Sản phẩm": ["view", "create", "edit"], "Đơn hàng": ["view", "edit"], "Khách hàng": ["view", "edit"], "Khuyến mãi": ["view", "create", "edit"] },
  staff:   { "Sản phẩm": ["view"], "Đơn hàng": ["view", "edit"], "Khách hàng": ["view"], "Khuyến mãi": ["view"] },
};

const seedStaff = () => ([
  { id: 1, name: "Minh Lê",       email: "minh.le@aurora.vn",    role: "admin",   status: "active",   lastActive: "Đang trực tuyến" },
  { id: 2, name: "Hương Giang",   email: "giang.ng@aurora.vn",   role: "manager", status: "active",   lastActive: "15 phút trước" },
  { id: 3, name: "Tuấn Anh",      email: "tuananh@aurora.vn",    role: "staff",   status: "active",   lastActive: "1 giờ trước" },
  { id: 4, name: "Khánh Vy",      email: "vy.tran@aurora.vn",    role: "staff",   status: "active",   lastActive: "Hôm qua" },
  { id: 5, name: "Đức Long",      email: "long.pham@aurora.vn",  role: "manager", status: "inactive", lastActive: "12 ngày trước" },
  { id: 6, name: "Thảo My",       email: "my.hoang@aurora.vn",   role: "staff",   status: "inactive", lastActive: "1 tháng trước" },
]);

const seedNotifs = () => ([
  { id: 1, icon: "shopping-cart", tone: "primary", title: "Đơn hàng mới #AUR-2607", text: "Nguyễn Thu Hà vừa đặt đơn 1.780.000₫", time: "5 phút trước", unread: true },
  { id: 2, icon: "alert-triangle", tone: "warning", title: "Sắp hết hàng", text: "Son kem lì Velvet Rose chỉ còn 8 sản phẩm", time: "42 phút trước", unread: true },
  { id: 3, icon: "user-plus", tone: "success", title: "Khách hàng mới", text: "Ngô Phương Linh vừa tạo tài khoản", time: "2 giờ trước", unread: true },
  { id: 4, icon: "ticket-percent", tone: "info", title: "Mã sắp hết lượt", text: "FREESHIP99 đã dùng 875/1000 lượt", time: "Hôm qua", unread: false },
]);

// Dữ liệu doanh thu cho biểu đồ (3 khoảng thời gian)
const REVENUE_DATA = {
  day: {
    labels: ["T2 29/6", "T3 30/6", "T4 1/7", "T5 2/7", "T6 3/7", "T7 4/7", "CN 5/7", "T2 6/7", "Hôm nay"],
    revenue: [8.2, 9.6, 7.4, 11.3, 12.8, 15.4, 14.1, 10.9, 6.3],
    orders: [14, 17, 12, 19, 22, 27, 25, 18, 11],
  },
  week: {
    labels: ["Tuần 19", "Tuần 20", "Tuần 21", "Tuần 22", "Tuần 23", "Tuần 24", "Tuần 25", "Tuần 26"],
    revenue: [52, 61, 58, 73, 69, 84, 91, 78],
    orders: [96, 110, 102, 131, 124, 149, 163, 140],
  },
  month: {
    labels: ["T8/25", "T9/25", "T10/25", "T11/25", "T12/25", "T1/26", "T2/26", "T3/26", "T4/26", "T5/26", "T6/26", "T7/26"],
    revenue: [182, 205, 231, 268, 342, 296, 254, 278, 301, 322, 348, 121],
    orders: [340, 386, 421, 478, 612, 530, 462, 495, 538, 571, 618, 214],
  },
};

const CATEGORY_REVENUE = [
  { label: "Công nghệ",  value: 42 },
  { label: "Thời trang", value: 26 },
  { label: "Mỹ phẩm",    value: 14 },
  { label: "Phụ kiện",   value: 11 },
  { label: "Gia dụng",   value: 7 },
];

const ACTIVITY_FEED = [
  { icon: "shopping-cart", tone: "primary", html: "<b>Nguyễn Thu Hà</b> đặt đơn hàng <b>#AUR-2607</b>", time: "5 phút trước" },
  { icon: "truck", tone: "info", html: "Đơn <b>#AUR-2604</b> đã bàn giao cho đơn vị vận chuyển", time: "38 phút trước" },
  { icon: "check-circle", tone: "success", html: "Đơn <b>#AUR-2601</b> giao thành công", time: "1 giờ trước" },
  { icon: "package", tone: "warning", html: "<b>Sneaker Cloudstep</b> sắp hết hàng (còn 12)", time: "3 giờ trước" },
  { icon: "x-circle", tone: "danger", html: "Đơn <b>#AUR-2597</b> bị hủy bởi khách hàng", time: "Hôm qua" },
];

/* ============ 2. HELPERS ============ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Định dạng tiền VND: 1290000 -> "1.290.000₫" */
const fmtMoney = (n) => n.toLocaleString("vi-VN") + "₫";

/** Định dạng ngày giờ ngắn gọn: "06/07 21:03" */
const fmtDate = (iso) => {
  const d = new Date(iso);
  const pad = (x) => String(x).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Lấy 2 chữ cái đầu làm avatar: "Nguyễn Thu Hà" -> "TH" */
const initials = (name) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts.at(-2)[0] + parts.at(-1)[0] : parts[0].slice(0, 2)).toUpperCase();
};

/** Escape HTML tránh lỗi khi render chuỗi người dùng nhập */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Tính tổng tiền 1 đơn hàng từ danh sách item */
const orderTotal = (order) =>
  order.items.reduce((sum, it) => {
    const p = DB.products.find((x) => x.id === it.productId);
    return sum + (p ? p.price * it.qty : 0);
  }, 0);

/** Vẽ lại icon lucide sau mỗi lần render động */
const refreshIcons = () => window.lucide && lucide.createIcons();

/** Animation đếm số tăng dần (count-up) */
function countUp(el, target, { duration = 1100, money = false, suffix = "" } = {}) {
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    const val = Math.round(target * ease(p));
    el.textContent = (money ? fmtMoney(val) : val.toLocaleString("vi-VN")) + suffix;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/** Phân trang mảng dữ liệu */
const paginate = (arr, page, per) => arr.slice((page - 1) * per, page * per);

/** Render các nút phân trang vào container */
function renderPagination(container, totalItems, page, per, onChange) {
  const totalPages = Math.max(1, Math.ceil(totalItems / per));
  const btn = (label, p, opts = {}) =>
    `<button class="page-btn ${opts.active ? "active" : ""}" data-p="${p}" ${opts.disabled ? "disabled" : ""} aria-label="Trang ${p}">${label}</button>`;

  // Cửa sổ số trang: 1 … (p-1) p (p+1) … n
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages.at(-1) !== "…") pages.push("…");
  }

  container.innerHTML =
    btn(`<i data-lucide="chevron-left"></i>`, page - 1, { disabled: page === 1 }) +
    pages.map((p) => (p === "…" ? `<span class="page-dots">…</span>` : btn(p, p, { active: p === page }))).join("") +
    btn(`<i data-lucide="chevron-right"></i>`, page + 1, { disabled: page === totalPages });

  refreshIcons();
  $$(".page-btn", container).forEach((b) =>
    b.addEventListener("click", () => !b.disabled && onChange(Number(b.dataset.p)))
  );
}

/** Cập nhật hiển thị mũi tên sắp xếp trên tiêu đề cột */
function markSortedHeader(tableEl, key, dir) {
  $$("th.sortable", tableEl).forEach((th) => {
    th.classList.remove("sorted-asc", "sorted-desc");
    const icon = th.querySelector("i, svg");
    if (th.dataset.sort === key) {
      th.classList.add(dir === 1 ? "sorted-asc" : "sorted-desc");
      if (icon) icon.setAttribute("data-lucide", dir === 1 ? "chevron-up" : "chevron-down");
    } else if (icon) icon.setAttribute("data-lucide", "chevrons-up-down");
  });
  refreshIcons();
}

/** HTML cho trạng thái rỗng (không có dữ liệu) */
const emptyStateHTML = (title, text) => `
  <div class="empty-state">
    <div class="empty-state__icon"><i data-lucide="inbox"></i></div>
    <strong>${title}</strong>
    <p>${text}</p>
  </div>`;

/* ============ 3. STATE ============ */

// "Cơ sở dữ liệu" trong bộ nhớ — có thể đặt lại từ trang Cài đặt
let DB = {
  products: seedProducts(),
  customers: seedCustomers(),
  orders: seedOrders(),
  promos: seedPromos(),
  staff: seedStaff(),
  notifs: seedNotifs(),
};

const state = {
  theme: "light",              // trạng thái dark mode lưu trong biến JS
  page: "dashboard",
  revenuePeriod: "day",
  activityFailedOnce: false,   // demo error state: lần đầu tải sẽ "lỗi"
  charts: { revenue: null, category: null },
  products: { search: "", category: "all", status: "all", sortKey: "sold", sortDir: -1, page: 1, per: 6 },
  orders: { search: "", status: "all", payment: "all", sortKey: "date", sortDir: -1, page: 1, per: 7 },
  customers: { search: "", tier: "all", sortKey: "spent", sortDir: -1, page: 1, per: 7 },
};

/* ============ 4. TOAST & MODAL ============ */

const TOAST_ICONS = { success: "check-circle", error: "x-circle", warning: "alert-triangle", info: "info" };

/** Hiện toast, tự ẩn sau 3.6s */
function showToast(type, title, msg = "") {
  const root = $("#toastRoot");
  const t = document.createElement("div");
  t.className = `toast toast--${type}`;
  t.innerHTML = `
    <span class="toast__icon"><i data-lucide="${TOAST_ICONS[type] || "info"}"></i></span>
    <div><strong>${esc(title)}</strong>${msg ? `<p>${esc(msg)}</p>` : ""}</div>
    <button class="icon-btn icon-btn--sm" aria-label="Đóng"><i data-lucide="x"></i></button>`;
  root.appendChild(t);
  refreshIcons();

  const dismiss = () => {
    t.classList.add("hide");
    t.addEventListener("animationend", () => t.remove(), { once: true });
  };
  t.querySelector("button").addEventListener("click", dismiss);
  setTimeout(dismiss, 3600);
}

/** Mở modal với nội dung HTML tuỳ ý */
function openModal(html, { size = "" } = {}) {
  const root = $("#modalRoot");
  root.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal__dialog ${size === "lg" ? "modal__dialog--lg" : ""}">${html}</div>
    </div>`;
  root.classList.add("open");
  root.classList.remove("closing");
  document.body.style.overflow = "hidden";
  refreshIcons();

  root.querySelector(".modal-backdrop").addEventListener("click", closeModal);
  $$("[data-close]", root).forEach((b) => b.addEventListener("click", closeModal));
}

function closeModal() {
  const root = $("#modalRoot");
  if (!root.classList.contains("open")) return;
  root.classList.add("closing");
  document.body.style.overflow = "";
  setTimeout(() => {
    root.classList.remove("open", "closing");
    root.innerHTML = "";
  }, 220);
}

document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());

/** Modal xác nhận hành động nguy hiểm */
function confirmModal({ title, text, confirmLabel = "Xóa", onConfirm }) {
  openModal(`
    <div class="modal__head"><h3>${esc(title)}</h3>
      <button class="icon-btn" data-close aria-label="Đóng"><i data-lucide="x"></i></button></div>
    <div class="modal__body"><p style="color:var(--text-2)">${esc(text)}</p></div>
    <div class="modal__foot">
      <button class="btn btn--ghost" data-close>Hủy bỏ</button>
      <button class="btn btn--danger" id="confirmYes">${esc(confirmLabel)}</button>
    </div>`);
  $("#confirmYes").addEventListener("click", () => { closeModal(); onConfirm(); });
}

/* ============ 5. LAYOUT: SIDEBAR / TOPBAR / THEME ============ */

function initLayout() {
  const app = $("#app");

  // Thu gọn / mở rộng sidebar (desktop)
  $("#collapseBtn").addEventListener("click", () => {
    app.classList.toggle("sidebar-collapsed");
    $("#compactSwitch").checked = app.classList.contains("sidebar-collapsed");
  });

  // Drawer trên mobile
  const closeDrawer = () => app.classList.remove("drawer-open");
  $("#hamburgerBtn").addEventListener("click", () => app.classList.add("drawer-open"));
  $("#sidebarClose").addEventListener("click", closeDrawer);
  $("#overlay").addEventListener("click", closeDrawer);

  // Điều hướng sidebar
  $$(".nav-item").forEach((item) =>
    item.addEventListener("click", (e) => {
      e.preventDefault();
      switchPage(item.dataset.page);
      closeDrawer();
    })
  );

  // Các nút "Xem tất cả" / điều hướng nhanh
  document.addEventListener("click", (e) => {
    const goto = e.target.closest("[data-goto]");
    if (goto) {
      switchPage(goto.dataset.goto);
      if (goto.dataset.action === "add-product") setTimeout(openProductForm, 450);
    }
  });

  // Dropdown (thông báo + user): mở/đóng, click ra ngoài để đóng
  const dropdowns = [["#notifBtn", "#notifDropdown"], ["#userBtn", "#userDropdown"]];
  dropdowns.forEach(([btnSel, ddSel]) => {
    $(btnSel).addEventListener("click", (e) => {
      e.stopPropagation();
      const dd = $(ddSel);
      const wasOpen = dd.classList.contains("open");
      $$(".dropdown").forEach((d) => d.classList.remove("open"));
      if (!wasOpen) dd.classList.add("open");
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) $$(".dropdown").forEach((d) => d.classList.remove("open"));
  });

  // Menu user
  $$("#userPanel [data-page]").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); switchPage("settings"); $$(".dropdown").forEach((d) => d.classList.remove("open")); })
  );
  $("#logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    showToast("info", "Đã đăng xuất (demo)", "Trong bản demo, phiên làm việc vẫn được giữ nguyên.");
    $$(".dropdown").forEach((d) => d.classList.remove("open"));
  });

  // Dark mode: đổi attribute + đồng bộ switch + vẽ lại biểu đồ
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#darkModeSwitch").addEventListener("change", toggleTheme);
  $("#compactSwitch").addEventListener("change", (e) => {
    app.classList.toggle("sidebar-collapsed", e.target.checked);
  });

  // Tìm kiếm toàn cục: Enter -> sang trang Sản phẩm với từ khoá
  const globalSearch = $("#globalSearch");
  globalSearch.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    state.products.search = globalSearch.value.trim();
    state.products.page = 1;
    $("#productSearch").value = state.products.search;
    switchPage("products");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault();
      globalSearch.focus();
    }
  });

  // Thông báo
  renderNotifs();
  $("#markAllRead").addEventListener("click", () => {
    DB.notifs.forEach((n) => (n.unread = false));
    renderNotifs();
    showToast("success", "Đã đọc tất cả thông báo");
  });

  // Nút xuất báo cáo (demo)
  $("#exportBtn").addEventListener("click", () =>
    showToast("info", "Đang chuẩn bị báo cáo…", "Tệp PDF sẽ được gửi tới email của bạn (demo).")
  );
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", state.theme);
  $("#darkModeSwitch").checked = state.theme === "dark";
  $("#themeToggle").innerHTML = `<i data-lucide="${state.theme === "dark" ? "sun" : "moon"}"></i>`;
  refreshIcons();
  // Biểu đồ dùng màu đọc từ CSS variables -> cần vẽ lại
  if (state.page === "dashboard") buildCharts();
}

function renderNotifs() {
  const tones = { primary: ["var(--primary-soft)", "var(--primary)"], warning: ["var(--warning-soft)", "var(--warning)"], success: ["var(--success-soft)", "var(--success)"], info: ["var(--info-soft)", "var(--info)"] };
  $("#notifList").innerHTML = DB.notifs.map((n) => {
    const [bg, fg] = tones[n.tone];
    return `
      <div class="notif-item ${n.unread ? "unread" : ""}">
        <div class="notif-item__icon" style="background:${bg};color:${fg}"><i data-lucide="${n.icon}"></i></div>
        <div><strong>${esc(n.title)}</strong><p>${esc(n.text)}</p><time>${esc(n.time)}</time></div>
      </div>`;
  }).join("");
  const unread = DB.notifs.filter((n) => n.unread).length;
  const badge = $("#notifBadge");
  badge.textContent = unread;
  badge.style.display = unread ? "grid" : "none";
  refreshIcons();
}

/* ============ 6. ROUTER + SKELETON ============ */

const PAGE_RENDERERS = {
  dashboard: renderDashboard,
  products: renderProducts,
  orders: renderOrders,
  customers: renderCustomers,
  promos: renderPromos,
  staff: renderStaff,
  settings: () => {},
};

/** Skeleton hiển thị trong lúc "tải" trang (giả lập độ trễ mạng) */
const SKELETON_HTML = `
  <div class="skel-grid">
    <div class="skeleton"></div><div class="skeleton"></div>
    <div class="skeleton"></div><div class="skeleton"></div>
  </div>
  <div class="skel-rows">
    <div class="skeleton"></div><div class="skeleton"></div>
    <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
  </div>`;

let skeletonTimer = null;

function switchPage(page) {
  if (!PAGE_RENDERERS[page]) return;
  state.page = page;

  // Đánh dấu menu đang chọn
  $$(".nav-item").forEach((i) => i.classList.toggle("active", i.dataset.page === page));

  // Ẩn mọi trang, hiện skeleton rồi render nội dung thật (fade-in)
  $$(".page").forEach((p) => p.classList.remove("active"));
  const target = $(`#page-${page}`);

  const skel = document.createElement("section");
  skel.className = "page active";
  skel.id = "page-skeleton";
  skel.innerHTML = SKELETON_HTML;
  $("#page-skeleton")?.remove();
  $("#content").prepend(skel);

  clearTimeout(skeletonTimer);
  skeletonTimer = setTimeout(() => {
    skel.remove();
    target.classList.add("active");
    PAGE_RENDERERS[page]();
    document.title = `${target.dataset.title} — Aurora Admin`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 480);
}

/* ============ 7. DASHBOARD ============ */

function renderDashboard() {
  renderKPIs();
  buildCharts();
  renderTopProducts();
  renderRecentOrders();
  renderActivity();
}

function renderKPIs() {
  const totalRevenue = DB.orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + orderTotal(o), 0);
  const totalOrders = DB.orders.length;
  const pending = DB.orders.filter((o) => o.status === "pending").length;
  const customers = DB.customers.length;
  const lowStock = DB.products.filter((p) => p.status === "low" || p.status === "out").length;

  const kpis = [
    { hero: true, label: "Doanh thu tuần này", value: totalRevenue, money: true, icon: "wallet", trend: "+18,2%", up: true, meta: "so với tuần trước" },
    { label: "Đơn hàng", value: totalOrders, icon: "shopping-bag", grad: "var(--grad-teal)", trend: "+9,4%", up: true, meta: `${pending} đơn chờ xử lý` },
    { label: "Khách hàng", value: customers, icon: "users", grad: "var(--grad-amber)", trend: "+3,1%", up: true, meta: "4 khách mới tháng này" },
    { label: "Cảnh báo tồn kho", value: lowStock, icon: "package-x", grad: "var(--grad-rose)", trend: "-2", up: false, meta: "sản phẩm sắp hết / hết hàng" },
  ];

  $("#kpiGrid").innerHTML = kpis.map((k) => `
    <article class="kpi ${k.hero ? "kpi--hero" : ""}">
      <div class="kpi__top">
        <span class="kpi__label">${k.label}</span>
        <span class="kpi__icon" style="${k.hero ? "" : `background:${k.grad}`}"><i data-lucide="${k.icon}"></i></span>
      </div>
      <div class="kpi__value" data-count="${k.value}" data-money="${!!k.money}">0</div>
      <div class="kpi__meta">
        <span class="trend ${k.up ? "trend--up" : "trend--down"}">
          <i data-lucide="${k.up ? "arrow-up-right" : "arrow-down-right"}"></i>${k.trend}
        </span>
        <span>${k.meta}</span>
      </div>
    </article>`).join("");
  refreshIcons();

  // Count-up cho từng số liệu
  $$("#kpiGrid [data-count]").forEach((el) =>
    countUp(el, Number(el.dataset.count), { money: el.dataset.money === "true" })
  );

  // Badge số đơn chờ xử lý trên sidebar
  $("#ordersNavBadge").textContent = pending;
  $("#ordersNavBadge").style.display = pending ? "" : "none";
}

/** Đọc màu từ CSS variables để biểu đồ khớp theme sáng/tối */
function chartTheme() {
  const css = getComputedStyle(document.documentElement);
  return {
    text: css.getPropertyValue("--text-3").trim(),
    grid: state.theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(25,28,46,0.06)",
    primary: "#5D5FEF",
    accent: "#14B8A6",
    surface: css.getPropertyValue("--surface").trim(),
  };
}

function buildCharts() {
  if (typeof Chart === "undefined") return; // CDN chưa tải xong / offline
  const t = chartTheme();
  Chart.defaults.font.family = "Inter, sans-serif";
  Chart.defaults.color = t.text;

  /* --- Biểu đồ doanh thu (line + area gradient) --- */
  const data = REVENUE_DATA[state.revenuePeriod];
  const ctx = $("#revenueChart").getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, "rgba(93,95,239,0.28)");
  grad.addColorStop(1, "rgba(93,95,239,0)");

  state.charts.revenue?.destroy();
  state.charts.revenue = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        { label: "Doanh thu (triệu ₫)", data: data.revenue, borderColor: t.primary, backgroundColor: grad, fill: true, tension: 0.42, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: t.primary, pointBorderColor: t.surface, pointBorderWidth: 2 },
        { label: "Đơn hàng", data: data.orders, borderColor: t.accent, borderDash: [5, 5], tension: 0.42, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: t.accent, yAxisID: "y1" },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 850, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 7, padding: 18 } },
        tooltip: { backgroundColor: state.theme === "dark" ? "#1C2033" : "#191C2E", padding: 12, cornerRadius: 10, titleFont: { weight: "700" } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: t.grid }, border: { display: false }, ticks: { callback: (v) => v + "tr" } },
        y1: { position: "right", grid: { display: false }, border: { display: false } },
      },
    },
  });

  /* --- Biểu đồ tròn theo danh mục --- */
  const palette = ["#5D5FEF", "#14B8A6", "#F59E0B", "#F43F5E", "#8B5CF6"];
  state.charts.category?.destroy();
  state.charts.category = new Chart($("#categoryChart"), {
    type: "doughnut",
    data: {
      labels: CATEGORY_REVENUE.map((c) => c.label),
      datasets: [{ data: CATEGORY_REVENUE.map((c) => c.value), backgroundColor: palette, borderColor: t.surface, borderWidth: 3, hoverOffset: 8 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "68%",
      animation: { animateRotate: true, duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: state.theme === "dark" ? "#1C2033" : "#191C2E", padding: 12, cornerRadius: 10, callbacks: { label: (c) => ` ${c.label}: ${c.parsed}%` } },
      },
    },
  });

  $("#categoryLegend").innerHTML = CATEGORY_REVENUE.map((c, i) => `
    <span class="legend__item"><span class="legend__swatch" style="background:${palette[i]}"></span>${c.label} · ${c.value}%</span>`).join("");
}

function renderTopProducts() {
  const top = [...DB.products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const max = top[0]?.sold || 1;
  $("#topProducts").innerHTML = top.map((p) => `
    <div class="top-product">
      <div class="top-product__thumb" style="background:${p.tint}">${p.emoji}</div>
      <div class="top-product__info">
        <strong>${esc(p.name)}</strong>
        <div class="top-product__bar"><span data-w="${Math.round((p.sold / max) * 100)}"></span></div>
      </div>
      <span class="top-product__sold">${p.sold} đã bán</span>
    </div>`).join("");

  // Đặt width sau 1 frame để CSS transition chạy animation thanh tiến trình
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      $$("#topProducts .top-product__bar span").forEach((s) => (s.style.width = s.dataset.w + "%"))
    )
  );
}

function renderRecentOrders() {
  const recent = [...DB.orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  $("#recentOrders").innerHTML = recent.map((o) => {
    const c = DB.customers.find((x) => x.id === o.customerId);
    const s = ORDER_STATUS[o.status];
    return `
      <div class="mini-order" data-id="${o.id}">
        <div class="avatar avatar--sm" style="background:${s.grad}">${initials(c.name)}</div>
        <div class="mini-order__info"><strong>${o.code}</strong><span>${esc(c.name)} · ${fmtDate(o.date)}</span></div>
        <div>
          <div class="mini-order__amount">${fmtMoney(orderTotal(o))}</div>
          <span class="badge badge--${s.tone}" style="margin-top:3px">${s.label}</span>
        </div>
      </div>`;
  }).join("");
  $$("#recentOrders .mini-order").forEach((el) =>
    el.addEventListener("click", () => openOrderDetail(Number(el.dataset.id)))
  );
}

/** Demo error state: lần tải đầu tiên giả lập lỗi mạng, bấm "Thử lại" sẽ thành công */
function renderActivity() {
  const box = $("#activityFeed");

  if (!state.activityFailedOnce) {
    state.activityFailedOnce = true;
    box.innerHTML = `
      <div class="error-state">
        <div class="error-state__icon"><i data-lucide="wifi-off"></i></div>
        <strong>Không tải được dữ liệu</strong>
        <p>Kết nối tới máy chủ hoạt động bị gián đoạn. Vui lòng thử lại.</p>
        <button class="btn btn--ghost btn--sm" id="retryActivity"><i data-lucide="refresh-cw"></i> Thử lại</button>
      </div>`;
    refreshIcons();
    $("#retryActivity").addEventListener("click", renderActivity);
    return;
  }

  const tones = { primary: ["var(--primary-soft)", "var(--primary)"], info: ["var(--info-soft)", "var(--info)"], success: ["var(--success-soft)", "var(--success)"], warning: ["var(--warning-soft)", "var(--warning)"], danger: ["var(--danger-soft)", "var(--danger)"] };
  box.innerHTML = ACTIVITY_FEED.map((a) => {
    const [bg, fg] = tones[a.tone];
    return `
      <div class="activity-item">
        <div class="activity-item__dot" style="background:${bg};color:${fg}"><i data-lucide="${a.icon}"></i></div>
        <div><p>${a.html}</p><time>${a.time}</time></div>
      </div>`;
  }).join("");
  refreshIcons();
}

/* ============ 8. PRODUCTS ============ */

const PRODUCT_STATUS = {
  active: { label: "Đang bán", tone: "success" },
  low:    { label: "Sắp hết",  tone: "warning" },
  out:    { label: "Hết hàng", tone: "danger" },
  hidden: { label: "Đang ẩn",  tone: "neutral" },
};

/** Tự suy trạng thái tồn kho từ số lượng (trừ khi đang ẩn) */
const inferStatus = (p) => (p.status === "hidden" ? "hidden" : p.stock === 0 ? "out" : p.stock <= 15 ? "low" : "active");

function getFilteredProducts() {
  const f = state.products;
  const q = f.search.toLowerCase();
  let rows = DB.products.filter((p) =>
    (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
    (f.category === "all" || p.category === f.category) &&
    (f.status === "all" || p.status === f.status)
  );
  rows.sort((a, b) => {
    const va = a[f.sortKey], vb = b[f.sortKey];
    return (typeof va === "string" ? va.localeCompare(vb, "vi") : va - vb) * f.sortDir;
  });
  return rows;
}

function renderProducts() {
  const f = state.products;
  const rows = getFilteredProducts();
  const pageRows = paginate(rows, f.page, f.per);
  const tbody = $("#productTbody");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" data-label="">${emptyStateHTML("Không tìm thấy sản phẩm", "Thử đổi từ khoá hoặc xoá bớt bộ lọc để xem thêm kết quả.")}</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map((p, i) => {
      const s = PRODUCT_STATUS[p.status];
      const stockPct = Math.min(100, Math.round((p.stock / 120) * 100));
      const stockColor = p.stock === 0 ? "var(--danger)" : p.stock <= 15 ? "var(--warning)" : "var(--success)";
      return `
        <tr style="animation-delay:${i * 35}ms">
          <td data-label="Sản phẩm">
            <div class="cell-product">
              <div class="cell-product__thumb" style="background:${p.tint}">${p.emoji}</div>
              <div><strong>${esc(p.name)}</strong><small>SKU: ${esc(p.sku)} · ${p.variants.length} biến thể</small></div>
            </div>
          </td>
          <td data-label="Danh mục"><span class="badge badge--primary">${esc(p.category)}</span></td>
          <td data-label="Giá" class="cell-money">${fmtMoney(p.price)}</td>
          <td data-label="Tồn kho" class="stock-cell">
            <span style="font-weight:600">${p.stock}</span>
            <div class="stock-bar"><span style="width:${stockPct}%;background:${stockColor}"></span></div>
          </td>
          <td data-label="Đã bán" class="cell-muted">${p.sold}</td>
          <td data-label="Trạng thái"><span class="badge badge--${s.tone}">${s.label}</span></td>
          <td data-label="" class="td-actions">
            <button class="icon-btn icon-btn--sm" data-act="edit" data-id="${p.id}" title="Sửa"><i data-lucide="pencil"></i></button>
            <button class="icon-btn icon-btn--sm" data-act="del" data-id="${p.id}" title="Xóa"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>`;
    }).join("");
  }

  $("#productCount").textContent = rows.length
    ? `Hiển thị ${(f.page - 1) * f.per + 1}–${Math.min(f.page * f.per, rows.length)} trong ${rows.length} sản phẩm`
    : "0 sản phẩm";

  renderPagination($("#productPagination"), rows.length, f.page, f.per, (p) => { f.page = p; renderProducts(); });
  markSortedHeader($("#productTable"), f.sortKey, f.sortDir);
  refreshIcons();

  $$("#productTbody [data-act]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = Number(b.dataset.id);
      b.dataset.act === "edit" ? openProductForm(id) : deleteProduct(id);
    })
  );
}

function initProductsPage() {
  const f = state.products;

  // Đổ danh mục vào bộ lọc
  $("#productCategory").innerHTML =
    `<option value="all">Tất cả danh mục</option>` + CATEGORIES.map((c) => `<option>${c}</option>`).join("");

  $("#productSearch").addEventListener("input", (e) => { f.search = e.target.value; f.page = 1; renderProducts(); });
  $("#productCategory").addEventListener("change", (e) => { f.category = e.target.value; f.page = 1; renderProducts(); });
  $("#productStatus").addEventListener("change", (e) => { f.status = e.target.value; f.page = 1; renderProducts(); });
  $("#addProductBtn").addEventListener("click", () => openProductForm());

  // Sắp xếp khi bấm tiêu đề cột
  $$("#productTable th.sortable").forEach((th) =>
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      f.sortDir = f.sortKey === key ? -f.sortDir : 1;
      f.sortKey = key;
      renderProducts();
    })
  );
}

/** Form thêm / sửa sản phẩm (có quản lý biến thể động) */
function openProductForm(id = null) {
  const p = id ? DB.products.find((x) => x.id === id) : null;
  const variantRow = (v = { label: "", stock: "" }) => `
    <div class="variant-row">
      <input class="input v-label" placeholder="VD: M / Đen" value="${esc(v.label)}" />
      <input class="input v-stock" type="number" min="0" placeholder="Tồn kho" value="${v.stock}" style="max-width:110px" />
      <button type="button" class="icon-btn icon-btn--sm v-del" title="Xóa biến thể"><i data-lucide="x"></i></button>
    </div>`;

  openModal(`
    <div class="modal__head">
      <h3>${p ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
      <button class="icon-btn" data-close aria-label="Đóng"><i data-lucide="x"></i></button>
    </div>
    <div class="modal__body">
      <form class="form" id="productForm">
        <div class="form-row">
          <label class="field"><span>Tên sản phẩm *</span><input class="input" id="pfName" required value="${p ? esc(p.name) : ""}" placeholder="VD: Áo hoodie oversize" /></label>
          <label class="field"><span>Mã SKU</span><input class="input" id="pfSku" value="${p ? esc(p.sku) : ""}" placeholder="VD: AH-OVS-01" /></label>
        </div>
        <div class="form-row">
          <label class="field"><span>Danh mục</span>
            <select class="select select--full" id="pfCategory">
              ${CATEGORIES.map((c) => `<option ${p?.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select></label>
          <label class="field"><span>Giá bán (₫) *</span><input class="input" id="pfPrice" type="number" min="0" required value="${p ? p.price : ""}" placeholder="199000" /></label>
        </div>
        <div class="field">
          <span>Biến thể (size, màu…) & tồn kho</span>
          <div class="variant-list" id="variantList">
            ${(p?.variants || [{ label: "", stock: "" }]).map(variantRow).join("")}
          </div>
          <button type="button" class="btn btn--ghost btn--sm" id="addVariant" style="align-self:flex-start"><i data-lucide="plus"></i> Thêm biến thể</button>
        </div>
        <label class="field" style="flex-direction:row;align-items:center;gap:10px">
          <input type="checkbox" id="pfHidden" ${p?.status === "hidden" ? "checked" : ""} style="width:15px;height:15px;accent-color:var(--primary)" />
          <span style="font-weight:500;color:var(--text-2)">Ẩn sản phẩm khỏi cửa hàng</span>
        </label>
      </form>
    </div>
    <div class="modal__foot">
      <button class="btn btn--ghost" data-close>Hủy bỏ</button>
      <button class="btn btn--primary" id="saveProduct"><i data-lucide="check"></i> ${p ? "Lưu thay đổi" : "Thêm sản phẩm"}</button>
    </div>`, { size: "lg" });

  const bindVariantDeletes = () =>
    $$("#variantList .v-del").forEach((b) => (b.onclick = () => { b.closest(".variant-row").remove(); }));
  bindVariantDeletes();

  $("#addVariant").addEventListener("click", () => {
    $("#variantList").insertAdjacentHTML("beforeend", variantRow());
    refreshIcons();
    bindVariantDeletes();
  });

  $("#saveProduct").addEventListener("click", () => {
    const name = $("#pfName").value.trim();
    const price = Number($("#pfPrice").value);
    if (!name || !price) return showToast("error", "Thiếu thông tin", "Vui lòng nhập tên sản phẩm và giá bán hợp lệ.");

    const variants = $$("#variantList .variant-row")
      .map((r) => ({ label: r.querySelector(".v-label").value.trim(), stock: Number(r.querySelector(".v-stock").value) || 0 }))
      .filter((v) => v.label);
    const stock = variants.reduce((s, v) => s + v.stock, 0);

    const base = {
      name,
      sku: $("#pfSku").value.trim() || "SKU-" + Date.now().toString().slice(-6),
      category: $("#pfCategory").value,
      price, stock, variants,
      status: $("#pfHidden").checked ? "hidden" : "active",
    };

    if (p) {
      Object.assign(p, base);
      p.status = inferStatus(p);
      showToast("success", "Đã lưu thay đổi", `"${name}" đã được cập nhật.`);
    } else {
      const item = { id: Math.max(0, ...DB.products.map((x) => x.id)) + 1, sold: 0, emoji: "🛍️", tint: "#EDEBFF", ...base };
      item.status = inferStatus(item);
      DB.products.unshift(item);
      showToast("success", "Đã thêm sản phẩm", `"${name}" đã có mặt trong kho hàng.`);
    }
    closeModal();
    renderProducts();
  });
}

function deleteProduct(id) {
  const p = DB.products.find((x) => x.id === id);
  confirmModal({
    title: "Xóa sản phẩm?",
    text: `"${p.name}" sẽ bị xóa vĩnh viễn khỏi kho hàng. Hành động này không thể hoàn tác.`,
    onConfirm: () => {
      DB.products = DB.products.filter((x) => x.id !== id);
      renderProducts();
      showToast("success", "Đã xóa sản phẩm", `"${p.name}" đã được gỡ khỏi hệ thống.`);
    },
  });
}

/* ============ 9. ORDERS ============ */

const ORDER_STATUS = {
  pending:   { label: "Chờ xử lý",  tone: "warning", grad: "var(--grad-amber)" },
  shipping:  { label: "Đang giao",  tone: "info",    grad: "var(--grad-teal)" },
  completed: { label: "Hoàn thành", tone: "success", grad: "var(--grad-primary)" },
  cancelled: { label: "Đã hủy",     tone: "danger",  grad: "var(--grad-rose)" },
};

function getFilteredOrders() {
  const f = state.orders;
  const q = f.search.toLowerCase();
  let rows = DB.orders.filter((o) => {
    const c = DB.customers.find((x) => x.id === o.customerId);
    return (o.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) &&
      (f.status === "all" || o.status === f.status) &&
      (f.payment === "all" || o.payment === f.payment);
  });
  rows.sort((a, b) => {
    const key = f.sortKey;
    const va = key === "total" ? orderTotal(a) : a[key];
    const vb = key === "total" ? orderTotal(b) : b[key];
    return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * f.sortDir;
  });
  return rows;
}

function renderOrders() {
  const f = state.orders;
  const rows = getFilteredOrders();
  const pageRows = paginate(rows, f.page, f.per);

  // Cập nhật số lượng trên các tab trạng thái
  $$("#orderTabs .status-tab").forEach((tab) => {
    const st = tab.dataset.status;
    const n = st === "all" ? DB.orders.length : DB.orders.filter((o) => o.status === st).length;
    tab.querySelector("span").textContent = n;
    tab.classList.toggle("active", f.status === st);
  });

  const tbody = $("#orderTbody");
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" data-label="">${emptyStateHTML("Không có đơn hàng nào", "Chưa có đơn hàng khớp với bộ lọc hiện tại.")}</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map((o, i) => {
      const c = DB.customers.find((x) => x.id === o.customerId);
      const s = ORDER_STATUS[o.status];
      return `
        <tr style="animation-delay:${i * 35}ms">
          <td data-label="Mã đơn"><strong>${o.code}</strong><span class="cell-sub">${o.items.length} sản phẩm</span></td>
          <td data-label="Khách hàng">
            <div class="cell-person">
              <div class="avatar avatar--sm">${initials(c.name)}</div>
              <div><strong>${esc(c.name)}</strong><small>${esc(c.phone)}</small></div>
            </div>
          </td>
          <td data-label="Ngày đặt" class="cell-muted">${fmtDate(o.date)}</td>
          <td data-label="Thanh toán" class="cell-muted">${o.payment}</td>
          <td data-label="Tổng tiền" class="cell-money">${fmtMoney(orderTotal(o))}</td>
          <td data-label="Trạng thái"><span class="badge badge--${s.tone}">${s.label}</span></td>
          <td data-label="" class="td-actions">
            <button class="icon-btn icon-btn--sm" data-id="${o.id}" title="Xem chi tiết"><i data-lucide="eye"></i></button>
          </td>
        </tr>`;
    }).join("");
  }

  $("#orderCount").textContent = rows.length
    ? `Hiển thị ${(f.page - 1) * f.per + 1}–${Math.min(f.page * f.per, rows.length)} trong ${rows.length} đơn hàng`
    : "0 đơn hàng";
  renderPagination($("#orderPagination"), rows.length, f.page, f.per, (p) => { f.page = p; renderOrders(); });
  markSortedHeader($("#orderTable"), f.sortKey, f.sortDir);
  refreshIcons();

  $$("#orderTbody [data-id]").forEach((b) =>
    b.addEventListener("click", () => openOrderDetail(Number(b.dataset.id)))
  );
}

function initOrdersPage() {
  const f = state.orders;
  $("#orderSearch").addEventListener("input", (e) => { f.search = e.target.value; f.page = 1; renderOrders(); });
  $("#orderPayment").addEventListener("change", (e) => { f.payment = e.target.value; f.page = 1; renderOrders(); });
  $$("#orderTabs .status-tab").forEach((tab) =>
    tab.addEventListener("click", () => { f.status = tab.dataset.status; f.page = 1; renderOrders(); })
  );
  $$("#orderTable th.sortable").forEach((th) =>
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      f.sortDir = f.sortKey === key ? -f.sortDir : 1;
      f.sortKey = key;
      renderOrders();
    })
  );
}

/** Modal chi tiết đơn hàng + cập nhật trạng thái */
function openOrderDetail(id) {
  const o = DB.orders.find((x) => x.id === id);
  const c = DB.customers.find((x) => x.id === o.customerId);

  openModal(`
    <div class="modal__head">
      <h3>Đơn hàng ${o.code}</h3>
      <button class="icon-btn" data-close aria-label="Đóng"><i data-lucide="x"></i></button>
    </div>
    <div class="modal__body">
      <div class="order-meta">
        <div class="order-meta__item"><small>Khách hàng</small><strong>${esc(c.name)}</strong><span class="cell-sub">${esc(c.phone)} · ${esc(c.email)}</span></div>
        <div class="order-meta__item"><small>Thanh toán</small><strong>${o.payment}</strong><span class="cell-sub">Đặt lúc ${fmtDate(o.date)}</span></div>
      </div>
      <div class="order-items">
        ${o.items.map((it) => {
          const p = DB.products.find((x) => x.id === it.productId);
          return `
            <div class="order-item">
              <div class="cell-product__thumb" style="background:${p.tint}">${p.emoji}</div>
              <div><strong style="font-size:13.5px">${esc(p.name)}</strong>
                <div class="order-item__qty">${esc(it.variant)} · SL: ${it.qty}</div></div>
              <span class="order-item__price">${fmtMoney(p.price * it.qty)}</span>
            </div>`;
        }).join("")}
        <div class="order-total"><span>Tổng cộng</span><span>${fmtMoney(orderTotal(o))}</span></div>
      </div>
      <label class="field">
        <span>Trạng thái đơn hàng</span>
        <select class="select select--full" id="orderStatusSelect">
          ${Object.entries(ORDER_STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${v.label}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="modal__foot">
      <button class="btn btn--ghost" data-close>Đóng</button>
      <button class="btn btn--primary" id="updateOrderBtn"><i data-lucide="check"></i> Cập nhật trạng thái</button>
    </div>`, { size: "lg" });

  $("#updateOrderBtn").addEventListener("click", () => {
    const newStatus = $("#orderStatusSelect").value;
    if (newStatus === o.status) { closeModal(); return; }
    o.status = newStatus;
    closeModal();
    showToast("success", "Đã cập nhật đơn hàng", `${o.code} chuyển sang "${ORDER_STATUS[newStatus].label}".`);
    if (state.page === "orders") renderOrders();
    if (state.page === "dashboard") { renderKPIs(); renderRecentOrders(); }
  });
}

/* ============ 10. CUSTOMERS ============ */

const TIER = {
  vip:   { label: "VIP",        tone: "primary" },
  loyal: { label: "Thân thiết", tone: "info" },
  new:   { label: "Mới",        tone: "neutral" },
};

function getFilteredCustomers() {
  const f = state.customers;
  const q = f.search.toLowerCase();
  let rows = DB.customers.filter((c) =>
    (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))) &&
    (f.tier === "all" || c.tier === f.tier)
  );
  rows.sort((a, b) => {
    const va = a[f.sortKey], vb = b[f.sortKey];
    return (typeof va === "string" ? va.localeCompare(vb, "vi") : va - vb) * f.sortDir;
  });
  return rows;
}

function renderCustomers() {
  const f = state.customers;
  const rows = getFilteredCustomers();
  const pageRows = paginate(rows, f.page, f.per);
  const tbody = $("#customerTbody");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" data-label="">${emptyStateHTML("Không tìm thấy khách hàng", "Thử tìm bằng tên, email hoặc số điện thoại khác.")}</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map((c, i) => `
      <tr style="animation-delay:${i * 35}ms">
        <td data-label="Khách hàng">
          <div class="cell-person">
            <div class="avatar avatar--sm">${initials(c.name)}</div>
            <div><strong>${esc(c.name)}</strong><small>Tham gia ${new Date(c.joined).toLocaleDateString("vi-VN")}</small></div>
          </div>
        </td>
        <td data-label="Liên hệ"><span style="display:block">${esc(c.email)}</span><span class="cell-sub">${esc(c.phone)}</span></td>
        <td data-label="Đơn hàng" class="cell-muted">${c.orders} đơn</td>
        <td data-label="Tổng chi tiêu" class="cell-money">${fmtMoney(c.spent)}</td>
        <td data-label="Hạng"><span class="badge badge--${TIER[c.tier].tone}">${TIER[c.tier].label}</span></td>
        <td data-label="" class="td-actions">
          <button class="icon-btn icon-btn--sm" data-id="${c.id}" title="Xem hồ sơ"><i data-lucide="eye"></i></button>
        </td>
      </tr>`).join("");
  }

  $("#customerCount").textContent = rows.length
    ? `Hiển thị ${(f.page - 1) * f.per + 1}–${Math.min(f.page * f.per, rows.length)} trong ${rows.length} khách hàng`
    : "0 khách hàng";
  renderPagination($("#customerPagination"), rows.length, f.page, f.per, (p) => { f.page = p; renderCustomers(); });
  markSortedHeader($("#customerTable"), f.sortKey, f.sortDir);
  refreshIcons();

  $$("#customerTbody [data-id]").forEach((b) =>
    b.addEventListener("click", () => openCustomerDetail(Number(b.dataset.id)))
  );
}

function initCustomersPage() {
  const f = state.customers;
  $("#customerSearch").addEventListener("input", (e) => { f.search = e.target.value; f.page = 1; renderCustomers(); });
  $("#customerTier").addEventListener("change", (e) => { f.tier = e.target.value; f.page = 1; renderCustomers(); });
  $$("#customerTable th.sortable").forEach((th) =>
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      f.sortDir = f.sortKey === key ? -f.sortDir : 1;
      f.sortKey = key;
      renderCustomers();
    })
  );
}

/** Hồ sơ khách hàng: thông tin liên hệ + lịch sử mua hàng */
function openCustomerDetail(id) {
  const c = DB.customers.find((x) => x.id === id);
  const history = DB.orders.filter((o) => o.customerId === id).sort((a, b) => b.date.localeCompare(a.date));

  openModal(`
    <div class="modal__head">
      <div class="cell-person">
        <div class="avatar">${initials(c.name)}</div>
        <div><h3>${esc(c.name)}</h3><small style="color:var(--text-3)">Khách hàng ${TIER[c.tier].label} · từ ${new Date(c.joined).toLocaleDateString("vi-VN")}</small></div>
      </div>
      <button class="icon-btn" data-close aria-label="Đóng"><i data-lucide="x"></i></button>
    </div>
    <div class="modal__body">
      <div class="order-meta">
        <div class="order-meta__item"><small>Email</small><strong>${esc(c.email)}</strong></div>
        <div class="order-meta__item"><small>Điện thoại</small><strong>${esc(c.phone)}</strong></div>
        <div class="order-meta__item"><small>Tổng đơn hàng</small><strong>${c.orders} đơn</strong></div>
        <div class="order-meta__item"><small>Tổng chi tiêu</small><strong>${fmtMoney(c.spent)}</strong></div>
      </div>
      <p style="font-weight:700;font-family:var(--font-display);margin-bottom:10px">Lịch sử mua hàng gần đây</p>
      ${history.length ? `
        <div class="order-items">
          ${history.map((o) => `
            <div class="order-item">
              <div><strong style="font-size:13.5px">${o.code}</strong>
                <div class="order-item__qty">${fmtDate(o.date)} · ${o.payment}</div></div>
              <span class="badge badge--${ORDER_STATUS[o.status].tone}" style="margin-left:auto">${ORDER_STATUS[o.status].label}</span>
              <span class="order-item__price" style="margin-left:14px">${fmtMoney(orderTotal(o))}</span>
            </div>`).join("")}
        </div>`
      : emptyStateHTML("Chưa có đơn hàng", "Khách hàng này chưa phát sinh giao dịch gần đây.")}
    </div>
    <div class="modal__foot"><button class="btn btn--ghost" data-close>Đóng</button></div>`, { size: "lg" });
}

/* ============ 11. PROMOS ============ */

function renderPromos() {
  const grid = $("#promoGrid");
  if (!DB.promos.length) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1">${emptyStateHTML("Chưa có mã giảm giá", "Tạo mã đầu tiên để thu hút khách hàng quay lại mua sắm.")}</div>`;
    refreshIcons();
    return;
  }

  grid.innerHTML = DB.promos.map((pr) => {
    const pct = Math.min(100, Math.round((pr.used / pr.limit) * 100));
    const valueText = pr.type === "percent" ? `Giảm ${pr.value}%` : `Giảm ${fmtMoney(pr.value)}`;
    return `
      <article class="card promo-card ${pr.active ? "" : "inactive"}">
        <div class="promo-card__top">
          <span class="promo-code">${esc(pr.code)}
            <button data-copy="${esc(pr.code)}" title="Sao chép mã"><i data-lucide="copy"></i></button>
          </span>
          <span class="badge badge--${pr.active ? "success" : "neutral"}">${pr.active ? "Đang chạy" : "Đã tắt"}</span>
        </div>
        <div>
          <div class="promo-card__value">${valueText}</div>
          <p class="promo-card__desc">${esc(pr.desc)} · Đơn tối thiểu ${fmtMoney(pr.minOrder)}</p>
        </div>
        <div>
          <div class="promo-usage"><span>Đã dùng ${pr.used}/${pr.limit}</span><span>HSD: ${new Date(pr.end).toLocaleDateString("vi-VN")}</span></div>
          <div class="promo-bar"><span data-w="${pct}"></span></div>
        </div>
        <div class="promo-card__foot">
          <label class="switch" title="Bật / tắt mã">
            <input type="checkbox" data-toggle="${pr.id}" ${pr.active ? "checked" : ""} />
            <span class="switch__track"></span>
          </label>
          <div class="actions">
            <button class="icon-btn icon-btn--sm" data-edit="${pr.id}" title="Sửa"><i data-lucide="pencil"></i></button>
            <button class="icon-btn icon-btn--sm" data-del="${pr.id}" title="Xóa"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      </article>`;
  }).join("");
  refreshIcons();

  // Animation thanh sử dụng
  requestAnimationFrame(() => requestAnimationFrame(() =>
    $$("#promoGrid .promo-bar span").forEach((s) => (s.style.width = s.dataset.w + "%"))
  ));

  // Sao chép mã vào clipboard
  $$("#promoGrid [data-copy]").forEach((b) =>
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); showToast("success", "Đã sao chép", `Mã ${b.dataset.copy} đã nằm trong clipboard.`); }
      catch { showToast("error", "Không sao chép được", "Trình duyệt chặn quyền truy cập clipboard."); }
    })
  );

  $$("#promoGrid [data-toggle]").forEach((sw) =>
    sw.addEventListener("change", () => {
      const pr = DB.promos.find((x) => x.id === Number(sw.dataset.toggle));
      pr.active = sw.checked;
      renderPromos();
      showToast(pr.active ? "success" : "info", pr.active ? "Đã bật mã giảm giá" : "Đã tắt mã giảm giá", `Mã ${pr.code} hiện ${pr.active ? "áp dụng được" : "ngừng áp dụng"}.`);
    })
  );

  $$("#promoGrid [data-edit]").forEach((b) => b.addEventListener("click", () => openPromoForm(Number(b.dataset.edit))));
  $$("#promoGrid [data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      const pr = DB.promos.find((x) => x.id === Number(b.dataset.del));
      confirmModal({
        title: "Xóa mã giảm giá?",
        text: `Mã "${pr.code}" sẽ bị xóa và không thể sử dụng nữa.`,
        onConfirm: () => {
          DB.promos = DB.promos.filter((x) => x.id !== pr.id);
          renderPromos();
          showToast("success", "Đã xóa mã giảm giá", `Mã ${pr.code} đã được gỡ bỏ.`);
        },
      });
    })
  );
}

function openPromoForm(id = null) {
  const pr = id ? DB.promos.find((x) => x.id === id) : null;
  openModal(`
    <div class="modal__head">
      <h3>${pr ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá"}</h3>
      <button class="icon-btn" data-close aria-label="Đóng"><i data-lucide="x"></i></button>
    </div>
    <div class="modal__body">
      <form class="form">
        <div class="form-row">
          <label class="field"><span>Mã code *</span><input class="input" id="prCode" style="text-transform:uppercase" value="${pr ? esc(pr.code) : ""}" placeholder="VD: SALE50" /></label>
          <label class="field"><span>Loại giảm giá</span>
            <select class="select select--full" id="prType">
              <option value="percent" ${pr?.type === "percent" ? "selected" : ""}>Theo phần trăm (%)</option>
              <option value="fixed" ${pr?.type === "fixed" ? "selected" : ""}>Số tiền cố định (₫)</option>
            </select></label>
        </div>
        <div class="form-row">
          <label class="field"><span>Giá trị giảm *</span><input class="input" id="prValue" type="number" min="1" value="${pr ? pr.value : ""}" placeholder="20" /></label>
          <label class="field"><span>Đơn tối thiểu (₫)</span><input class="input" id="prMin" type="number" min="0" value="${pr ? pr.minOrder : ""}" placeholder="500000" /></label>
        </div>
        <div class="form-row">
          <label class="field"><span>Giới hạn lượt dùng</span><input class="input" id="prLimit" type="number" min="1" value="${pr ? pr.limit : 500}" /></label>
          <label class="field"><span>Ngày hết hạn</span><input class="input" id="prEnd" type="date" value="${pr ? pr.end : "2026-12-31"}" /></label>
        </div>
        <label class="field"><span>Mô tả ngắn</span><input class="input" id="prDesc" value="${pr ? esc(pr.desc) : ""}" placeholder="VD: Ưu đãi cuối tuần cho mọi đơn hàng" /></label>
      </form>
    </div>
    <div class="modal__foot">
      <button class="btn btn--ghost" data-close>Hủy bỏ</button>
      <button class="btn btn--primary" id="savePromo"><i data-lucide="check"></i> ${pr ? "Lưu thay đổi" : "Tạo mã"}</button>
    </div>`);

  $("#savePromo").addEventListener("click", () => {
    const code = $("#prCode").value.trim().toUpperCase();
    const value = Number($("#prValue").value);
    if (!code || !value) return showToast("error", "Thiếu thông tin", "Vui lòng nhập mã code và giá trị giảm.");

    const base = {
      code, value,
      type: $("#prType").value,
      minOrder: Number($("#prMin").value) || 0,
      limit: Number($("#prLimit").value) || 500,
      end: $("#prEnd").value || "2026-12-31",
      desc: $("#prDesc").value.trim() || "Mã giảm giá của cửa hàng",
    };

    if (pr) { Object.assign(pr, base); showToast("success", "Đã lưu thay đổi", `Mã ${code} đã được cập nhật.`); }
    else {
      DB.promos.unshift({ id: Math.max(0, ...DB.promos.map((x) => x.id)) + 1, used: 0, active: true, ...base });
      showToast("success", "Đã tạo mã giảm giá", `Mã ${code} sẵn sàng để khách sử dụng.`);
    }
    closeModal();
    renderPromos();
  });
}

/* ============ 12. STAFF & PHÂN QUYỀN ============ */

function renderStaff() {
  // Thẻ tổng quan vai trò
  $("#roleCards").innerHTML = Object.entries(ROLES).map(([key, r]) => {
    const n = DB.staff.filter((s) => s.role === key).length;
    return `
      <article class="card role-card">
        <div class="role-card__icon" style="background:${r.grad}"><i data-lucide="${r.icon}"></i></div>
        <div><strong>${r.name} · ${n}</strong><p>${r.desc}</p></div>
      </article>`;
  }).join("");

  $("#staffTbody").innerHTML = DB.staff.map((s, i) => `
    <tr style="animation-delay:${i * 35}ms">
      <td data-label="Nhân viên">
        <div class="cell-person">
          <div class="avatar avatar--sm" style="background:${ROLES[s.role].grad}">${initials(s.name)}</div>
          <div><strong>${esc(s.name)}</strong><small>${esc(s.email)}</small></div>
        </div>
      </td>
      <td data-label="Vai trò"><span class="badge badge--primary">${ROLES[s.role].name}</span></td>
      <td data-label="Trạng thái"><span class="badge badge--${s.status === "active" ? "success" : "neutral"}">${s.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}</span></td>
      <td data-label="Hoạt động" class="cell-muted">${esc(s.lastActive)}</td>
      <td data-label="" class="td-actions">
        <button class="icon-btn icon-btn--sm" data-edit="${s.id}" title="Sửa & phân quyền"><i data-lucide="pencil"></i></button>
        <button class="icon-btn icon-btn--sm" data-del="${s.id}" title="Xóa"><i data-lucide="trash-2"></i></button>
      </td>
    </tr>`).join("");
  refreshIcons();

  $$("#staffTbody [data-edit]").forEach((b) => b.addEventListener("click", () => openStaffForm(Number(b.dataset.edit))));
  $$("#staffTbody [data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      const s = DB.staff.find((x) => x.id === Number(b.dataset.del));
      if (s.role === "admin") return showToast("warning", "Không thể xóa", "Tài khoản Quản trị viên không thể bị xóa.");
      confirmModal({
        title: "Xóa nhân viên?",
        text: `Tài khoản của ${s.name} sẽ mất quyền truy cập hệ thống ngay lập tức.`,
        onConfirm: () => {
          DB.staff = DB.staff.filter((x) => x.id !== s.id);
          renderStaff();
          showToast("success", "Đã xóa nhân viên", `${s.name} không còn quyền truy cập.`);
        },
      });
    })
  );
}

/** Form nhân viên + ma trận phân quyền theo vai trò */
function openStaffForm(id = null) {
  const s = id ? DB.staff.find((x) => x.id === id) : null;
  const role = s?.role || "staff";

  const permGrid = (roleKey) => PERM_MODULES.map((m) => `
    <div class="perm-row">
      <span>${m}</span>
      <div class="perm-checks">
        ${["view", "create", "edit", "delete"].map((p) => `
          <label><input type="checkbox" ${ROLE_PERMS[roleKey][m].includes(p) ? "checked" : ""} />
            ${{ view: "Xem", create: "Tạo", edit: "Sửa", delete: "Xóa" }[p]}</label>`).join("")}
      </div>
    </div>`).join("");

  openModal(`
    <div class="modal__head">
      <h3>${s ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}</h3>
      <button class="icon-btn" data-close aria-label="Đóng"><i data-lucide="x"></i></button>
    </div>
    <div class="modal__body">
      <form class="form">
        <div class="form-row">
          <label class="field"><span>Họ tên *</span><input class="input" id="stName" value="${s ? esc(s.name) : ""}" placeholder="VD: Nguyễn Văn A" /></label>
          <label class="field"><span>Email *</span><input class="input" id="stEmail" type="email" value="${s ? esc(s.email) : ""}" placeholder="ten@aurora.vn" /></label>
        </div>
        <div class="form-row">
          <label class="field"><span>Vai trò</span>
            <select class="select select--full" id="stRole">
              ${Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${role === k ? "selected" : ""}>${r.name}</option>`).join("")}
            </select></label>
          <label class="field"><span>Trạng thái</span>
            <select class="select select--full" id="stStatus">
              <option value="active" ${s?.status !== "inactive" ? "selected" : ""}>Đang hoạt động</option>
              <option value="inactive" ${s?.status === "inactive" ? "selected" : ""}>Ngưng hoạt động</option>
            </select></label>
        </div>
        <div class="field">
          <span>Quyền truy cập theo module</span>
          <div class="perm-grid" id="permGrid">${permGrid(role)}</div>
        </div>
      </form>
    </div>
    <div class="modal__foot">
      <button class="btn btn--ghost" data-close>Hủy bỏ</button>
      <button class="btn btn--primary" id="saveStaff"><i data-lucide="check"></i> ${s ? "Lưu thay đổi" : "Thêm nhân viên"}</button>
    </div>`, { size: "lg" });

  // Đổi vai trò -> nạp lại ma trận quyền mặc định của vai trò đó
  $("#stRole").addEventListener("change", (e) => { $("#permGrid").innerHTML = permGrid(e.target.value); });

  $("#saveStaff").addEventListener("click", () => {
    const name = $("#stName").value.trim();
    const email = $("#stEmail").value.trim();
    if (!name || !email) return showToast("error", "Thiếu thông tin", "Vui lòng nhập họ tên và email.");

    if (s) {
      Object.assign(s, { name, email, role: $("#stRole").value, status: $("#stStatus").value });
      showToast("success", "Đã lưu thay đổi", `Hồ sơ của ${name} đã được cập nhật.`);
    } else {
      DB.staff.push({ id: Math.max(0, ...DB.staff.map((x) => x.id)) + 1, name, email, role: $("#stRole").value, status: $("#stStatus").value, lastActive: "Chưa đăng nhập" });
      showToast("success", "Đã thêm nhân viên", `Lời mời đã gửi tới ${email}.`);
    }
    closeModal();
    renderStaff();
  });
}

/* ============ 13. SETTINGS ============ */

function initSettingsPage() {
  $("#storeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("success", "Đã lưu cài đặt", "Thông tin cửa hàng đã được cập nhật.");
  });

  $("#resetDataBtn").addEventListener("click", () =>
    confirmModal({
      title: "Đặt lại dữ liệu demo?",
      text: "Mọi thay đổi bạn đã thực hiện (sản phẩm, đơn hàng, mã giảm giá…) sẽ trở về trạng thái mẫu ban đầu.",
      confirmLabel: "Đặt lại",
      onConfirm: () => {
        DB = { products: seedProducts(), customers: seedCustomers(), orders: seedOrders(), promos: seedPromos(), staff: seedStaff(), notifs: seedNotifs() };
        state.activityFailedOnce = false;
        Object.assign(state.products, { search: "", category: "all", status: "all", page: 1 });
        Object.assign(state.orders, { search: "", status: "all", payment: "all", page: 1 });
        $("#productSearch").value = $("#orderSearch").value = $("#customerSearch").value = "";
        renderNotifs();
        showToast("success", "Đã đặt lại dữ liệu", "Toàn bộ dữ liệu mẫu đã được khôi phục.");
        switchPage("dashboard");
      },
    })
  );
}

/* ============ 14. INIT ============ */

document.addEventListener("DOMContentLoaded", () => {
  refreshIcons();
  initLayout();
  initProductsPage();
  initOrdersPage();
  initCustomersPage();
  initSettingsPage();

  // Trang đầu tiên: dashboard (đi qua router để có skeleton + animation)
  switchPage("dashboard");
});