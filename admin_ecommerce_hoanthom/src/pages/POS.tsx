import { useState, useMemo, useEffect, useRef } from 'react';
import {
    Search, X, User, Archive, Ticket, Check, Banknote, SmartphoneNfc,
    CreditCard, Wallet, Minus, Plus, CheckCircle, Printer, Clock, Trash2
} from 'lucide-react';
import {
    mockProducts, mockCustomers, mockOrders, mockPromos, CATEGORIES
} from '../data/mock';
import type { Product, Customer, Promo, Order } from '../types';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";
const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

interface CartItem {
    productId: number;
    variant: string | null;
    qty: number;
    price: number;
    name: string;
    emoji: string;
    tint: string;
}

interface HeldOrder {
    time: string;
    name: string;
    cart: CartItem[];
    promo: Promo | null;
    customer: Customer | null;
    payment: string;
}

export function POS() {
    const { showToast } = useToast();
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    // Modals
    const [variantProduct, setVariantProduct] = useState<Product | null>(null);
    const [successOrderCode, setSuccessOrderCode] = useState<string | null>(null);
    const [isHeldListOpen, setIsHeldListOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

    // Focus effect
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

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
    }, [cart, customer, promo, payment, cashGivenStr]);

    // Derived state
    const filteredProducts = useMemo(() => {
        const q = search.toLowerCase();
        return mockProducts.filter(p =>
            (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
            (category === "all" || p.category === category)
        );
    }, [search, category]);

    const customerResults = useMemo(() => {
        if (!customerSearch.trim()) return [];
        const val = customerSearch.toLowerCase().trim();
        return mockCustomers.filter(c => c.name.toLowerCase().includes(val) || c.phone.includes(val)).slice(0, 5);
    }, [customerSearch]);

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
    const addToCart = (product: Product, variantLabel: string | null) => {
        const existing = cart.find(i => i.productId === product.id && i.variant === variantLabel);
        const maxStock = variantLabel
            ? product.variants!.find(v => v.label === variantLabel)?.stock || 0
            : product.stock;

        if (existing) {
            if (existing.qty + 1 > maxStock) {
                showToast("warning", "Vượt tồn kho", "Không đủ số lượng trong kho.");
                return;
            }
            setCart(cart.map(item =>
                item === existing ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            if (maxStock < 1) {
                showToast("warning", "Hết hàng", "Sản phẩm đã hết hàng.");
                return;
            }
            setCart([...cart, {
                productId: product.id,
                variant: variantLabel,
                qty: 1,
                price: product.price,
                name: product.name,
                emoji: product.emoji,
                tint: product.tint
            }]);
        }

        // Check promo validity
        if (promo && subtotal + product.price < promo.minOrder) {
            // Just let the effect below handle it or ignore
        }
    };

    const updateCartQty = (idx: number, delta: number) => {
        const item = cart[idx];
        if (delta === -1) {
            if (item.qty <= 1) {
                setCart(cart.filter((_, i) => i !== idx));
            } else {
                const newCart = [...cart];
                newCart[idx].qty -= 1;
                setCart(newCart);
            }
        } else {
            const p = mockProducts.find(x => x.id === item.productId)!;
            const maxStock = item.variant ? p.variants!.find(v => v.label === item.variant)!.stock : p.stock;
            if (item.qty + 1 > maxStock) {
                showToast("warning", "Vượt tồn kho", "Không đủ số lượng trong kho.");
                return;
            }
            const newCart = [...cart];
            newCart[idx].qty += 1;
            setCart(newCart);
        }
    };

    // Promo effect: check minOrder when subtotal changes
    useEffect(() => {
        if (promo && subtotal > 0 && subtotal < promo.minOrder) {
            showToast("warning", "Gỡ mã", "Tổng đơn hàng không còn đủ điều kiện giảm giá.");
            setPromo(null);
        }
    }, [subtotal, promo, showToast]);

    const applyPromo = () => {
        const code = promoInput.trim().toUpperCase();
        if (!code) return;
        const p = mockPromos.find(x => x.code === code);

        if (!p) {
            showToast("error", "Lỗi", "Mã giảm giá không tồn tại");
            return;
        }
        if (!p.active) {
            showToast("error", "Lỗi", "Mã giảm giá không còn hoạt động");
            return;
        }
        if (p.used >= p.limit) {
            showToast("error", "Lỗi", "Mã giảm giá đã hết lượt sử dụng");
            return;
        }
        if (new Date(p.end) < new Date()) {
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

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (payment === "Tiền mặt" && cashGiven < finalTotal) {
      showToast("error", "Thất bại", "Khách đưa chưa đủ tiền.");
      return;
    }

    const now = new Date();
    const code = "POS-" + String(mockOrders.length + 1000).padStart(4, "0");
    const givenCashFinal = payment === "Tiền mặt" ? cashGiven : finalTotal;
    
    const newOrder: Order = {
      id: Date.now(),
      code: code,
      customerId: customer ? customer.id : 0,
      date: now.toISOString(),
      payment: payment,
      status: "completed",
      items: cart.map(i => ({ productId: i.productId, variant: i.variant || undefined, qty: i.qty })),
      discount: discountAmount,
      promoCode: promo ? promo.code : undefined,
    };

    // Cast isPOS to true (optional extension)
    (newOrder as any).isPOS = true;

    mockOrders.push(newOrder);

    // Update stock & sold
    cart.forEach(item => {
      const p = mockProducts.find(x => x.id === item.productId);
      if (p) {
        if (item.variant && p.variants) {
          const v = p.variants.find(x => x.label === item.variant);
          if (v) v.stock -= item.qty;
        }
        p.stock -= item.qty;
        p.sold += item.qty;
        if (p.stock === 0) p.status = 'out';
        else if (p.stock <= 5) p.status = 'low';
      }
    });

    // Update customer
    if (customer) {
      const c = mockCustomers.find(x => x.id === customer.id);
      if (c) {
        c.orders += 1;
        c.spent += finalTotal;
      }
    }

    // Update promo
    if (promo) {
      const p = mockPromos.find(x => x.code === promo.code);
      if (p) p.used += 1;
    }

    showToast("success", "Thành công", "Đã thanh toán đơn hàng");
    setSuccessOrderCode(code);
    setIsMobilePanelOpen(false);
  };

  const resetCart = () => {
    setCart([]);
    setPromo(null);
    setCustomer(null);
    setCustomerSearch("");
    setCashGivenStr("");
    setPayment("Tiền mặt");
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
                placeholder="Tìm theo tên hoặc SKU (Nhấn Esc để xóa)…" 
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
              {CATEGORIES.map(c => (
                <button 
                  key={c}
                  className={`badge ${category === c ? 'badge--primary active' : 'badge--neutral'}`} 
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="pos-product-grid">
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center" }}>
                <div className="empty-state">
                  <strong>Không có sản phẩm</strong>
                  <p>Vui lòng thử từ khóa khác</p>
                </div>
              </div>
            ) : (
              filteredProducts.map(p => {
                const disabled = p.stock === 0 || p.status === "out" || p.status === "hidden";
                const stockClass = p.stock === 0 ? "out" : p.stock <= 5 ? "low" : "";
                const stockText = p.stock === 0 ? "Hết hàng" : `Tồn: ${p.stock}`;
                return (
                  <div 
                    key={p.id} 
                    className={`pos-product-card ${disabled ? 'disabled' : ''}`}
                    onClick={() => {
                      if (disabled) return;
                      if (p.variants && p.variants.length > 0) setVariantProduct(p);
                      else addToCart(p, null);
                    }}
                  >
                    <div className="pos-product-card__thumb" style={{ background: p.tint }}>{p.emoji}</div>
                    <strong>{p.name}</strong>
                    <div className="pos-product-card__price">{fmtMoney(p.price)}</div>
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
                <div key={`${item.productId}-${item.variant}`} className="pos-cart-item">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: item.tint, display: 'grid', placeItems: 'center', fontSize: 18 }}>
                    {item.emoji}
                  </div>
                  <div className="pos-cart-item__info">
                    <strong>{item.name}</strong>
                    {item.variant && <small>{item.variant}</small>}
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
                        const raw = e.target.value.replace(/\\D/g, "");
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
                disabled={cart.length === 0 || (payment === 'Tiền mặt' && cashChange < 0)}
                onClick={handleCheckout}
              >
                <CheckCircle size={18} /> Thanh toán (F9)
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
          {variantProduct?.variants?.map((v, i) => {
            const disabled = v.stock === 0;
            return (
              <button 
                key={i}
                className={`btn ${disabled ? 'btn--ghost' : 'btn--primary'}`}
                disabled={disabled}
                onClick={() => {
                  addToCart(variantProduct, v.label);
                  setVariantProduct(null);
                }}
              >
                {v.label} (Tồn: {v.stock})
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
        isOpen={!!successOrderCode}
        onClose={() => { setSuccessOrderCode(null); searchInputRef.current?.focus(); }}
        title=""
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'center', gap: 12 }}>
            <button className="btn btn--ghost" onClick={() => window.print()}><Printer size={18}/> In hóa đơn</button>
            <button className="btn btn--primary" onClick={() => { setSuccessOrderCode(null); searchInputRef.current?.focus(); }}>Đơn mới</button>
          </div>
        }
      >
        <div style={{ textAlign: 'center', paddingTop: 0 }}>
          <div style={{ width: 64, height: 64, background: 'var(--success-soft)', color: 'var(--success)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={32} />
          </div>
          <h2 style={{ marginBottom: 8 }}>Thanh toán thành công</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>Đơn hàng {successOrderCode} đã được lưu hệ thống.</p>
          
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-2)' }}>Khách hàng:</span>
              <strong>{customer ? customer.name : "Khách lẻ"}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-2)' }}>Tổng tiền:</span>
              <strong style={{ fontSize: 16, color: 'var(--primary)' }}>{fmtMoney(finalTotal)}</strong>
            </div>
            {payment === "Tiền mặt" ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-2)' }}>Khách đưa:</span>
                  <strong>{fmtMoney(cashGiven || finalTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Tiền thừa:</span>
                  <strong>{fmtMoney(Math.max(0, (cashGiven || finalTotal) - finalTotal))}</strong>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>Thanh toán bằng:</span>
                <strong>{payment}</strong>
              </div>
            )}
          </div>
        </div>
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
