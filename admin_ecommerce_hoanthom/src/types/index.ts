export interface Category {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "hidden";
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface ProductVariant {
  label: string;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  status: "active" | "low" | "out" | "hidden";
  emoji: string;
  tint: string;
  variants: ProductVariant[];
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  joined: string;
  orders: number;
  spent: number;
  tier: "vip" | "loyal" | "new";
}

export interface OrderItem {
  productId: number;
  variant: string;
  qty: number;
}

export interface Order {
  id: number;
  code: string;
  customerId: number;
  date: string;
  payment: string;
  status: "pending" | "shipping" | "completed" | "cancelled";
  items: OrderItem[];
}

export interface Promo {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  used: number;
  limit: number;
  end: string;
  active: boolean;
  desc: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  status: "active" | "inactive";
  lastActive: string;
}

export interface Notif {
  id: number;
  icon: string;
  tone: "primary" | "warning" | "success" | "info" | "danger";
  title: string;
  text: string;
  time: string;
  unread: boolean;
}

export interface Activity {
  icon: string;
  tone: "primary" | "warning" | "success" | "info" | "danger";
  html: string;
  time: string;
}

export interface CategoryRevenue {
  label: string;
  value: number;
}

export interface RevenueData {
  labels: string[];
  revenue: number[];
  orders: number[];
}

export interface RevenuePeriodData {
  day: RevenueData;
  week: RevenueData;
  month: RevenueData;
}
