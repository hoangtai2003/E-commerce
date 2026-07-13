import type { Product, Customer, Order, Promo, Staff, Notif, Activity, CategoryRevenue, RevenuePeriodData } from '../types';

export const CATEGORIES = ["Thời trang", "Công nghệ", "Phụ kiện", "Mỹ phẩm", "Gia dụng"];

export const mockProducts: Product[] = [
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
];

export const mockCustomers: Customer[] = [
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
];

export const mockOrders: Order[] = [
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
];

export const mockPromos: Promo[] = [
  { id: 1, code: "SUMMER26",   type: "percent", value: 20, minOrder: 500000,  used: 342, limit: 500,  end: "2026-08-31", active: true,  desc: "Ưu đãi hè cho mọi đơn hàng" },
  { id: 2, code: "FREESHIP99", type: "fixed",   value: 30000, minOrder: 99000, used: 875, limit: 1000, end: "2026-12-31", active: true,  desc: "Hỗ trợ phí vận chuyển toàn quốc" },
  { id: 3, code: "VIPONLY",    type: "percent", value: 15, minOrder: 1000000, used: 58,  limit: 200,  end: "2026-09-15", active: true,  desc: "Dành riêng khách hàng hạng VIP" },
  { id: 4, code: "NEWBIE50",   type: "fixed",   value: 50000, minOrder: 200000, used: 421, limit: 600, end: "2026-07-31", active: true,  desc: "Chào mừng khách hàng mới" },
  { id: 5, code: "TET2026",    type: "percent", value: 30, minOrder: 800000,  used: 500, limit: 500,  end: "2026-02-10", active: false, desc: "Đã kết thúc dịp Tết Nguyên đán" },
  { id: 6, code: "FLASH12H",   type: "percent", value: 25, minOrder: 300000,  used: 96,  limit: 300,  end: "2026-07-12", active: true,  desc: "Flash sale cuối tuần, số lượng có hạn" },
];

export const ROLES = {
  admin:   { name: "Quản trị viên", icon: "Crown",       grad: "var(--grad-primary)", desc: "Toàn quyền hệ thống" },
  manager: { name: "Quản lý",       icon: "Briefcase",   grad: "var(--grad-teal)",    desc: "Quản lý vận hành, không sửa cài đặt" },
  staff:   { name: "Nhân viên",     icon: "User",        grad: "var(--grad-amber)",   desc: "Xử lý đơn hàng và kho" },
};

export const PERM_MODULES = ["Sản phẩm", "Đơn hàng", "Khách hàng", "Khuyến mãi"];
export const ROLE_PERMS = {
  admin:   { "Sản phẩm": ["view", "create", "edit", "delete"], "Đơn hàng": ["view", "create", "edit", "delete"], "Khách hàng": ["view", "create", "edit", "delete"], "Khuyến mãi": ["view", "create", "edit", "delete"] },
  manager: { "Sản phẩm": ["view", "create", "edit"], "Đơn hàng": ["view", "edit"], "Khách hàng": ["view", "edit"], "Khuyến mãi": ["view", "create", "edit"] },
  staff:   { "Sản phẩm": ["view"], "Đơn hàng": ["view", "edit"], "Khách hàng": ["view"], "Khuyến mãi": ["view"] },
};

export const mockStaff: Staff[] = [
  { id: 1, name: "Minh Lê",       email: "minh.le@aurora.vn",    role: "admin",   status: "active",   lastActive: "Đang trực tuyến" },
  { id: 2, name: "Hương Giang",   email: "giang.ng@aurora.vn",   role: "manager", status: "active",   lastActive: "15 phút trước" },
  { id: 3, name: "Tuấn Anh",      email: "tuananh@aurora.vn",    role: "staff",   status: "active",   lastActive: "1 giờ trước" },
  { id: 4, name: "Khánh Vy",      email: "vy.tran@aurora.vn",    role: "staff",   status: "active",   lastActive: "Hôm qua" },
  { id: 5, name: "Đức Long",      email: "long.pham@aurora.vn",  role: "manager", status: "inactive", lastActive: "12 ngày trước" },
  { id: 6, name: "Thảo My",       email: "my.hoang@aurora.vn",   role: "staff",   status: "inactive", lastActive: "1 tháng trước" },
];

export const mockNotifs: Notif[] = [
  { id: 1, icon: "ShoppingCart", tone: "primary", title: "Đơn hàng mới #AUR-2607", text: "Nguyễn Thu Hà vừa đặt đơn 1.780.000₫", time: "5 phút trước", unread: true },
  { id: 2, icon: "AlertTriangle", tone: "warning", title: "Sắp hết hàng", text: "Son kem lì Velvet Rose chỉ còn 8 sản phẩm", time: "42 phút trước", unread: true },
  { id: 3, icon: "UserPlus", tone: "success", title: "Khách hàng mới", text: "Ngô Phương Linh vừa tạo tài khoản", time: "2 giờ trước", unread: true },
  { id: 4, icon: "TicketPercent", tone: "info", title: "Mã sắp hết lượt", text: "FREESHIP99 đã dùng 875/1000 lượt", time: "Hôm qua", unread: false },
];

export const REVENUE_DATA: RevenuePeriodData = {
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

export const CATEGORY_REVENUE: CategoryRevenue[] = [
  { label: "Công nghệ",  value: 42 },
  { label: "Thời trang", value: 26 },
  { label: "Mỹ phẩm",    value: 14 },
  { label: "Phụ kiện",   value: 11 },
  { label: "Gia dụng",   value: 7 },
];

export const ACTIVITY_FEED: Activity[] = [
  { icon: "ShoppingCart", tone: "primary", html: "<b>Nguyễn Thu Hà</b> đặt đơn hàng <b>#AUR-2607</b>", time: "5 phút trước" },
  { icon: "Truck", tone: "info", html: "Đơn <b>#AUR-2604</b> đã bàn giao cho đơn vị vận chuyển", time: "38 phút trước" },
  { icon: "CheckCircle", tone: "success", html: "Đơn <b>#AUR-2601</b> giao thành công", time: "1 giờ trước" },
  { icon: "Package", tone: "warning", html: "<b>Sneaker Cloudstep</b> sắp hết hàng (còn 12)", time: "3 giờ trước" },
  { icon: "XCircle", tone: "danger", html: "Đơn <b>#AUR-2597</b> bị hủy bởi khách hàng", time: "Hôm qua" },
];
