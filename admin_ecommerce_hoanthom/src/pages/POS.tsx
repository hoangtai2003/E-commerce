import { useState, useMemo, useEffect, useRef } from 'react';
import {
    Search, X, User, Archive, Ticket, Check, Banknote, SmartphoneNfc,
    CreditCard, Wallet, Minus, Plus, CheckCircle, Printer, Clock, Trash2
} from 'lucide-react';
import type { Customer, Promo } from '../types';
import { getCategories } from '../services/categories';
import { getProducts, type ApiProduct } from '../services/products';
import { getProductVariants, type ApiProductVariant } from '../services/productVariants';
import { getProductImages, type ApiProductImage } from '../services/productImages';
import { getCustomers } from '../services/customers';
import { getPromotions } from '../services/promotions';
import { createOrder, type PaymentMethod } from '../services/orders';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { useOrders } from '../contexts/OrdersContext';

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";
const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

const PAYMENT_METHOD_MAP: Record<string, PaymentMethod> = {
    'Tiền mặt': 'cash',
    'Chuyển khoản': 'transfer',
    'Thẻ tín dụng': 'card',
    'Ví MoMo': 'momo',
};

interface PosVariant {
    id: number;
    label: string;
    price: number;
    stock: number;
}

interface PosProduct {
    id: number;
    name: string;
    categoryName: string;
    totalStock: number;
    isActive: boolean;
    variants: PosVariant[];
    thumbnailUrl: string | null;
}

interface CartItem {
    variantId: number;
    productId: number;
    productName: string;
    variantLabel: string | null;
    price: number;
    qty: number;
    maxStock: number;
    thumbnailUrl: string | null;
}

interface HeldOrder {
    time: string;
    name: string;
    cart: CartItem[];
    promo: Promo | null;
    customer: Customer | null;
    payment: string;
}

interface LastOrderSummary {
    code: string;
    customerName: string;
    total: number;
    payment: string;
    cashGiven: number;
}

const variantLabel = (v: ApiProductVariant) => v.variant_name || [v.size, v.color].filter(Boolean).join(' / ') || v.sku;

export function POS() {
    const { showToast } = useToast();
    const { setOrders } = useOrders();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Data từ server
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
    const [apiVariants, setApiVariants] = useState<ApiProductVariant[]>([]);
    const [apiImages, setApiImages] = useState<ApiProductImage[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [promotions, setPromotions] = useState<Promo[]>([]);
    const [loading, setLoading] = useState(true);

    // States
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const [promo, setPromo] = useState<Promo | null>(null);
    const [promoInput, setPromoInput] = useState("");
    const [payment, setPayment] = useState("Tiền mặt");
    const [cashGivenStr, setCashGivenStr] = useState("");
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);

    // Modals
    const [variantProduct, setVariantProduct] = useState<PosProduct | null>(null);
    const [lastOrder, setLastOrder] = useState<LastOrderSummary | null>(null);
    const [isHeldListOpen, setIsHeldListOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

    const loadCatalog = () => {
        return Promise.all([getProducts(), getProductVariants(), getProductImages()]).then(([prods, variants, images]) => {
            setApiProducts(prods);
            setApiVariants(variants);
            setApiImages(images);
        });
    };

    useEffect(() => {
        Promise.all([getCategories(), getProducts(), getProductVariants(), getProductImages(), getCustomers(), getPromotions()])
            .then(([cats, prods, variants, images, customersData, promosData]) => {
                setCategories(cats);
                setApiProducts(prods);
                setApiVariants(variants);
                setApiImages(images);
                setCustomers(customersData);
                setPromotions(promosData);
            })
            .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải dữ liệu bán hàng từ máy chủ.'))
            .finally(() => setLoading(false));
    }, [showToast]);

    // Focus effect
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const products: PosProduct[] = useMemo(() => {
        const categoryNameById = new Map(categories.map(c => [c.id, c.name]));
        return apiProducts.map(p => {
            const variants = apiVariants
                .filter(v => v.product === p.id)
                .map(v => ({ id: v.id, label: variantLabel(v), price: v.price, stock: v.stock }));
            const productImages = apiImages.filter(img => img.product === p.id);
            const thumb = productImages.find(img => img.is_primary) ?? productImages[0];
            return {
                id: p.id,
                name: p.name,
                categoryName: categoryNameById.get(p.category) ?? '—',
                totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
                isActive: p.is_active,
                variants,
                thumbnailUrl: thumb ? (thumb.thumbnail_url ?? thumb.image_url) : null,
            };
        });
    }, [apiProducts, apiVariants, apiImages, categories]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if a modal is open
            if (document.querySelector('.modal-root.open')) return;

            if (e.key === "Escape") {
                setSearch("");
            } else if (e.key === "F9") {
                e.preventDefault();
                if (cart.length > 0) {
                    handleCheckout();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, customer, promo, payment, cashGivenStr]);

    // Derived state
    const filteredProducts = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter(p =>
            (p.name.toLowerCase().includes(q) || p.variants.some(v => v.label.toLowerCase().includes(q))) &&
            (category === "all" || p.categoryName === category)
        );
    }, [products, search, category]);

    const customerResults = useMemo(() => {
        if (!customerSearch.trim()) return [];
        const val = customerSearch.toLowerCase().trim();
        return customers.filter(c => c.name.toLowerCase().includes(val) || c.phone.includes(val)).slice(0, 5);
    }, [customers, customerSearch]);

    const subtotal = useMemo(() => cart.reduce((s, i) => s + (i.price * i.qty), 0), [cart]);
    const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

    const discountAmount = useMemo(() => {
        if (!promo) return 0;
        if (promo.type === 'fixed') return promo.value;
        return Math.floor(subtotal * promo.value / 100);
    }, [promo, subtotal]);

    const finalTotal = subtotal - discountAmount;

    const cashGiven = parseInt(cashGivenStr.replace(/\D/g, "")) || 0;
    const cashChange = cashGiven - finalTotal;

    // Actions
    const addToCart = (product: PosProduct, variant: PosVariant) => {
        const existing = cart.find(i => i.variantId === variant.id);

        if (existing) {
            if (existing.qty + 1 > variant.stock) {
                showToast("warning", "Vượt tồn kho", "Không đủ số lượng trong kho.");
                return;
            }
            setCart(cart.map(item =>
                item === existing ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            if (variant.stock < 1) {
                showToast("warning", "Hết hàng", "Sản phẩm đã hết hàng.");
                return;
            }
            setCart([...cart, {
                variantId: variant.id,
                productId: product.id,
                productName: product.name,
                variantLabel: product.variants.length > 1 ? variant.label : null,
                price: variant.price,
                qty: 1,
                maxStock: variant.stock,
                thumbnailUrl: product.thumbnailUrl,
            }]);
        }
    };

    const updateCartQty = (idx: number, delta: number) => {
        const item = cart[idx];
        if (delta === -1) {
            if (item.qty <= 1) {
                setCart(cart.filter((_, i) => i !== idx));
            } else {
                const newCart = [...cart];
                newCart[idx] = { ...item, qty: item.qty - 1 };
                setCart(newCart);
            }
        } else {
            if (item.qty + 1 > item.maxStock) {
                showToast("warning", "Vượt tồn kho", "Không đủ số lượng trong kho.");
                return;
            }
            const newCart = [...cart];
            newCart[idx] = { ...item, qty: item.qty + 1 };
            setCart(newCart);
        }
    };

    // Promo effect: check minOrder when subtotal changes
    useEffect(() => {
        if (promo && subtotal > 0 && subtotal < promo.minOrder) {
            showToast("warning", "Gỡ mã", "Tổng đơn hàng không còn đủ điều kiện giảm giá.");
            setPromo(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtotal]);

    const applyPromo = () => {
        const code = promoInput.trim().toUpperCase();
        if (!code) return;
        const p = promotions.find(x => x.code === code);

        if (!p) {
            showToast("error", "Lỗi", "Mã giảm giá không tồn tại");
            return;
        }
        if (!p.active) {
            showToast("error", "Lỗi", "Mã giảm giá không còn hoạt động");
            return;
        }
        if (p.limit > 0 && p.used >= p.limit) {
            showToast("error", "Lỗi", "Mã giảm giá đã hết lượt sử dụng");
            return;
        }
        if (p.end && new Date(p.end) < new Date()) {
            showToast("error", "Lỗi", "Mã giảm giá đã hết hạn");
            return;
        }
        if (subtotal < p.minOrder) {
            showToast("error", "Lỗi", `Đơn hàng tối thiểu ${fmtMoney(p.minOrder)} để áp dụng.`);
            return;
        }

        setPromo(p);
        setPromoInput("");
        showToast("success", "Thành công", `Đã áp mã giảm giá ${p.code}`);
    };

    const resetCart = () => {
        setCart([]);
        setPromo(null);
        setCustomer(null);
        setCustomerSearch("");
        setCashGivenStr("");
        setPayment("Tiền mặt");
    };

    const handleCheckout = async () => {
        if (cart.length === 0 || checkingOut) return;
        if (payment === "Tiền mặt" && cashGiven < finalTotal) {
            showToast("error", "Thất bại", "Khách đưa chưa đủ tiền.");
            return;
        }

        setCheckingOut(true);
        try {
            const created = await createOrder({
                customer: customer?.id ?? null,
                channel: 'pos',
                status: 'completed',
                payment_method: PAYMENT_METHOD_MAP[payment] ?? 'cash',
                amount_paid: payment === 'Tiền mặt' ? cashGiven : finalTotal,
                promotion: promo?.id ?? null,
                items: cart.map(i => ({ variant: i.variantId, quantity: i.qty })),
            });

            setOrders(prev => [created, ...prev]);
            showToast("success", "Thành công", "Đã thanh toán đơn hàng");

            setLastOrder({
                code: created.code,
                customerName: customer ? customer.name : "Khách lẻ",
                total: created.total,
                payment,
                cashGiven,
            });
            resetCart();
            setIsMobilePanelOpen(false);
            loadCatalog().catch(() => {});
        } catch {
            showToast("error", "Thất bại", "Không thể tạo đơn hàng. Vui lòng thử lại.");
        } finally {
            setCheckingOut(false);
        }
    };

    const handleHoldOrder = () => {
        if (cart.length > 0) {
            const holdName = customer ? customer.name : "Khách lẻ";
            const time = new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });

            setHeldOrders([...heldOrders, {
                time,
                name: holdName,
                cart: [...cart],
                promo,
                customer,
                payment
            }]);

            showToast("info", "Đã tạm giữ đơn", `Đơn của ${holdName} lúc ${time}`);
            resetCart();
        } else {
            if (heldOrders.length === 0) {
                showToast("info", "Thông báo", "Không có đơn tạm giữ");
                return;
            }
            setIsHeldListOpen(true);
        }
    };

    const restoreHoldOrder = (idx: number) => {
        if (cart.length > 0) {
            showToast("warning", "Giỏ hàng đang có sản phẩm", "Hãy xử lý hoặc tạm giữ đơn hiện tại trước.");
            return;
        }
        const h = heldOrders[idx];
        setCart(h.cart);
        setPromo(h.promo);
        setCustomer(h.customer);
        setPayment(h.payment);
        if (h.customer) setCustomerSearch(`${h.customer.name} - ${h.customer.phone}`);

        setHeldOrders(heldOrders.filter((_, i) => i !== idx));
        setIsHeldListOpen(false);
    };

    return (
        <section className="page active" id="page-pos" data-title="Bán hàng">
            <div className="pos-layout">
                {/* CỘT TRÁI */}
                <div className="pos-left">
                    <div className="pos-toolbar">
                        <div className="search search--full">
                            <Search size={18} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Tìm theo tên hoặc biến thể (Nhấn Esc để xóa)…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="pos-categories">
                            <button
                                className={`badge ${category === 'all' ? 'badge--primary active' : 'badge--neutral'}`}
                                onClick={() => setCategory('all')}
                            >
                                Tất cả
                            </button>
                            {categories.map(c => (
                                <button
                                    key={c.id}
                                    className={`badge ${category === c.name ? 'badge--primary active' : 'badge--neutral'}`}
                                    onClick={() => setCategory(c.name)}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="pos-product-grid">
                        {loading ? (
                            <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center" }}>
                                <div className="empty-state">
                                    <strong>Đang tải…</strong>
                                </div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center" }}>
                                <div className="empty-state">
                                    <strong>Không có sản phẩm</strong>
                                    <p>Vui lòng thử từ khóa khác</p>
                                </div>
                            </div>
                        ) : (
                            filteredProducts.map(p => {
                                const disabled = p.totalStock === 0 || !p.isActive;
                                const stockClass = p.totalStock === 0 ? "out" : p.totalStock <= 5 ? "low" : "";
                                const stockText = p.totalStock === 0 ? "Hết hàng" : `Tồn: ${p.totalStock}`;
                                const minPrice = p.variants.length ? Math.min(...p.variants.map(v => v.price)) : 0;
                                return (
                                    <div
                                        key={p.id}
                                        className={`pos-product-card ${disabled ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (disabled) return;
                                            if (p.variants.length === 1) addToCart(p, p.variants[0]);
                                            else if (p.variants.length > 1) setVariantProduct(p);
                                        }}
                                    >
                                        <div className="pos-product-card__thumb" style={{ background: '#e5e7eb', overflow: 'hidden', padding: 0 }}>
                                            {p.thumbnailUrl ? (
                                                <img src={p.thumbnailUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : '📦'}
                                        </div>
                                        <strong>{p.name}</strong>
                                        <div className="pos-product-card__price">{fmtMoney(minPrice)}</div>
                                        <div className={`pos-product-card__stock ${stockClass}`}>{stockText}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI (GIỎ HÀNG) */}
                <div className={`card pos-cart-panel ${isMobilePanelOpen ? 'open' : ''}`}>
                    <div className="pos-cart-head">
                        <h3>Đơn hiện tại</h3>
                        <div className="pos-customer-select dropdown">
                            <div className="search search--sm">
                                <User size={16} />
                                <input
                                    type="text"
                                    placeholder="Khách lẻ (Tìm SĐT/Tên)"
                                    value={customerSearch}
                                    onChange={e => {
                                        setCustomerSearch(e.target.value);
                                        if (!customer) setIsCustomerDropdownOpen(true);
                                    }}
                                    onFocus={() => { if (!customer) setIsCustomerDropdownOpen(true); }}
                                    onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                                    disabled={!!customer}
                                />
                                {customer && (
                                    <button
                                        className="icon-btn icon-btn--sm"
                                        onClick={() => { setCustomer(null); setCustomerSearch(""); }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            {isCustomerDropdownOpen && customerSearch && (
                                <div className="dropdown__panel" style={{ opacity: 1, pointerEvents: 'auto', display: 'block' }}>
                                    {customerResults.length > 0 ? (
                                        customerResults.map(c => (
                                            <div
                                                key={c.id}
                                                className="dropdown__item"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    setCustomer(c);
                                                    setCustomerSearch(`${c.name} - ${c.phone}`);
                                                    setIsCustomerDropdownOpen(false);
                                                }}
                                            >
                                                <div className="avatar avatar--sm">{initials(c.name)}</div>
                                                <div style={{ lineHeight: 1.2 }}>
                                                    <strong>{c.name}</strong>
                                                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{c.phone}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: 10, fontSize: 12.5, color: 'var(--text-3)' }}>Không tìm thấy khách.</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            className="icon-btn icon-btn--sm"
                            title="Tạm giữ / Danh sách giữ"
                            onClick={handleHoldOrder}
                        >
                            <Archive size={16} />
                            {heldOrders.length > 0 && <span className="badge-dot">{heldOrders.length}</span>}
                        </button>
                        {isMobilePanelOpen && (
                            <button
                                className="icon-btn icon-btn--sm pos-cart-close-btn"
                                style={{ position: 'absolute', top: 12, right: 12 }}
                                onClick={() => setIsMobilePanelOpen(false)}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="pos-cart-body">
                        {cart.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <div className="empty-state">
                                    <strong>Giỏ hàng trống</strong>
                                    <p>Chọn sản phẩm ở bên trái để bắt đầu</p>
                                </div>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={item.variantId} className="pos-cart-item">
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e5e7eb', display: 'grid', placeItems: 'center', fontSize: 18, overflow: 'hidden' }}>
                                        {item.thumbnailUrl ? (
                                            <img src={item.thumbnailUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : '📦'}
                                    </div>
                                    <div className="pos-cart-item__info">
                                        <strong>{item.productName}</strong>
                                        {item.variantLabel && <small>{item.variantLabel}</small>}
                                        <div className="pos-cart-item__price">{fmtMoney(item.price)}</div>
                                    </div>
                                    <div className="pos-cart-item__qty">
                                        <button onClick={() => updateCartQty(idx, -1)}><Minus size={14} /></button>
                                        <span>{item.qty}</span>
                                        <button onClick={() => updateCartQty(idx, 1)}><Plus size={14} /></button>
                                    </div>
                                    <div className="pos-cart-item__total">{fmtMoney(item.price * item.qty)}</div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pos-cart-foot">
                        <div className="pos-summary">
                            <div className="pos-summary-row">
                                <span>Tạm tính ({cartCount} món)</span>
                                <strong>{fmtMoney(subtotal)}</strong>
                            </div>
                            <div className="pos-promo-wrap">
                                {!promo ? (
                                    <div className="search search--sm">
                                        <Ticket size={16} />
                                        <input
                                            type="text"
                                            placeholder="Mã giảm giá"
                                            value={promoInput}
                                            onChange={e => setPromoInput(e.target.value)}
                                        />
                                        <button className="btn btn--sm btn--ghost" onClick={applyPromo}>Áp dụng</button>
                                    </div>
                                ) : (
                                    <div className="pos-promo-active">
                                        <span className="badge badge--success"><Check size={14} /> {promo.code}</span>
                                        <button className="icon-btn icon-btn--sm" onClick={() => setPromo(null)}><X size={14} /></button>
                                    </div>
                                )}
                            </div>
                            {promo && (
                                <div className="pos-summary-row pos-discount-row">
                                    <span>Giảm giá</span>
                                    <strong style={{ color: 'var(--danger)' }}>-{fmtMoney(discountAmount)}</strong>
                                </div>
                            )}
                            <div className="pos-summary-row pos-total-row">
                                <span>Khách phải trả</span>
                                <strong style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{fmtMoney(finalTotal)}</strong>
                            </div>
                        </div>

                        <div className="pos-payment-methods">
                            <button className={`pos-pay-btn ${payment === 'Tiền mặt' ? 'active' : ''}`} onClick={() => setPayment('Tiền mặt')}><Banknote size={16} /> Tiền mặt</button>
                            <button className={`pos-pay-btn ${payment === 'Chuyển khoản' ? 'active' : ''}`} onClick={() => setPayment('Chuyển khoản')}><SmartphoneNfc size={16} /> Chuyển khoản</button>
                            <button className={`pos-pay-btn ${payment === 'Thẻ tín dụng' ? 'active' : ''}`} onClick={() => setPayment('Thẻ tín dụng')}><CreditCard size={16} /> Thẻ tín dụng</button>
                            <button className={`pos-pay-btn ${payment === 'Ví MoMo' ? 'active' : ''}`} onClick={() => setPayment('Ví MoMo')}><Wallet size={16} /> Ví MoMo</button>
                        </div>

                        {payment === "Tiền mặt" && (
                            <div className="pos-cash-input">
                                <div className="form-row">
                                    <label className="field">
                                        <span>Khách đưa</span>
                                        <input
                                            type="text"
                                            className="input input--money"
                                            placeholder="0"
                                            value={cashGivenStr}
                                            onChange={e => {
                                                const raw = e.target.value.replace(/\D/g, "");
                                                setCashGivenStr(raw ? Number(raw).toLocaleString("vi-VN") : "");
                                            }}
                                        />
                                    </label>
                                    <label className="field">
                                        <span>Tiền thừa</span>
                                        <input
                                            type="text"
                                            className="input input--money"
                                            readOnly
                                            value={cashChange < 0 && cashGivenStr ? `Thiếu ${fmtMoney(Math.abs(cashChange))}` : (cashGivenStr ? fmtMoney(cashChange) : "0₫")}
                                            style={{ color: cashChange < 0 && cashGivenStr ? 'var(--danger)' : '' }}
                                        />
                                    </label>
                                </div>
                                <div className="pos-cash-suggest">
                                    <button className="badge badge--neutral" onClick={() => setCashGivenStr((cashGiven + 50000).toLocaleString("vi-VN"))}>50k</button>
                                    <button className="badge badge--neutral" onClick={() => setCashGivenStr((cashGiven + 100000).toLocaleString("vi-VN"))}>100k</button>
                                    <button className="badge badge--neutral" onClick={() => setCashGivenStr((cashGiven + 200000).toLocaleString("vi-VN"))}>200k</button>
                                    <button className="badge badge--neutral" onClick={() => setCashGivenStr((cashGiven + 500000).toLocaleString("vi-VN"))}>500k</button>
                                    <button className="badge badge--primary" onClick={() => setCashGivenStr(finalTotal.toLocaleString("vi-VN"))}>Đủ tiền</button>
                                </div>
                            </div>
                        )}

                        <div className="pos-actions">
                            <button className="btn btn--danger-outline" onClick={() => {
                                if (cart.length > 0) setIsCancelConfirmOpen(true);
                            }}>Hủy đơn</button>
                            <button
                                className="btn btn--primary"
                                style={{ flex: 1, justifyContent: 'center', fontSize: 15 }}
                                disabled={cart.length === 0 || checkingOut || (payment === 'Tiền mặt' && cashChange < 0)}
                                onClick={handleCheckout}
                            >
                                <CheckCircle size={18} /> {checkingOut ? 'Đang xử lý…' : 'Thanh toán (F9)'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE TOGGLE */}
            <div className="pos-mobile-toggle" onClick={() => setIsMobilePanelOpen(true)}>
                <span>Giỏ hàng ({cartCount} món)</span>
                <strong>{fmtMoney(finalTotal)}</strong>
            </div>

            {/* MODALS */}
            {/* Variant Selection Modal */}
            <Modal
                isOpen={!!variantProduct}
                onClose={() => setVariantProduct(null)}
                title={variantProduct?.name || ""}
            >
                <p style={{ marginBottom: 12, color: 'var(--text-2)' }}>Chọn biến thể:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {variantProduct?.variants.map((v) => {
                        const disabled = v.stock === 0;
                        return (
                            <button
                                key={v.id}
                                className={`btn ${disabled ? 'btn--ghost' : 'btn--primary'}`}
                                disabled={disabled}
                                onClick={() => {
                                    addToCart(variantProduct, v);
                                    setVariantProduct(null);
                                }}
                            >
                                {v.label} — {fmtMoney(v.price)} (Tồn: {v.stock})
                            </button>
                        );
                    })}
                </div>
            </Modal>

            {/* Cancel Confirm Modal */}
            <Modal
                isOpen={isCancelConfirmOpen}
                onClose={() => setIsCancelConfirmOpen(false)}
                title="Hủy đơn hàng hiện tại?"
                footer={
                    <>
                        <button className="btn btn--ghost" onClick={() => setIsCancelConfirmOpen(false)}>Quay lại</button>
                        <button className="btn btn--danger" onClick={() => {
                            resetCart();
                            setIsCancelConfirmOpen(false);
                        }}>Xác nhận hủy</button>
                    </>
                }
            >
                <p>Bạn có chắc muốn làm trống giỏ hàng hiện tại không?</p>
            </Modal>

            {/* Success Modal */}
            <Modal
                isOpen={!!lastOrder}
                onClose={() => { setLastOrder(null); searchInputRef.current?.focus(); }}
                title=""
                footer={
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'center', gap: 12 }}>
                        <button className="btn btn--ghost" onClick={() => window.print()}><Printer size={18} /> In hóa đơn</button>
                        <button className="btn btn--primary" onClick={() => { setLastOrder(null); searchInputRef.current?.focus(); }}>Đơn mới</button>
                    </div>
                }
            >
                {lastOrder && (
                    <div style={{ textAlign: 'center', paddingTop: 0 }}>
                        <div style={{ width: 64, height: 64, background: 'var(--success-soft)', color: 'var(--success)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                            <CheckCircle size={32} />
                        </div>
                        <h2 style={{ marginBottom: 8 }}>Thanh toán thành công</h2>
                        <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>Đơn hàng {lastOrder.code} đã được lưu hệ thống.</p>

                        <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-2)' }}>Khách hàng:</span>
                                <strong>{lastOrder.customerName}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-2)' }}>Tổng tiền:</span>
                                <strong style={{ fontSize: 16, color: 'var(--primary)' }}>{fmtMoney(lastOrder.total)}</strong>
                            </div>
                            {lastOrder.payment === "Tiền mặt" ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ color: 'var(--text-2)' }}>Khách đưa:</span>
                                        <strong>{fmtMoney(lastOrder.cashGiven || lastOrder.total)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-2)' }}>Tiền thừa:</span>
                                        <strong>{fmtMoney(Math.max(0, (lastOrder.cashGiven || lastOrder.total) - lastOrder.total))}</strong>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-2)' }}>Thanh toán bằng:</span>
                                    <strong>{lastOrder.payment}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Held Orders List */}
            <Modal
                isOpen={isHeldListOpen}
                onClose={() => setIsHeldListOpen(false)}
                title="Danh sách đơn tạm giữ"
            >
                {heldOrders.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
                        <div>
                            <strong>{h.name}</strong>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                                <Clock size={12} style={{ verticalAlign: -2 }} /> {h.time} · {h.cart.length} món
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="icon-btn icon-btn--sm"
                                onClick={() => setHeldOrders(heldOrders.filter((_, idx) => idx !== i))}
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                className="btn btn--sm btn--primary"
                                onClick={() => restoreHoldOrder(i)}
                            >
                                Nạp lại
                            </button>
                        </div>
                    </div>
                ))}
                {heldOrders.length === 0 && <p style={{ color: 'var(--text-3)' }}>Không có đơn tạm giữ.</p>}
            </Modal>

        </section>
    );
}
