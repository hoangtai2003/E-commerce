import {
    User, X, Archive, Ticket, Check, Banknote, SmartphoneNfc,
    CreditCard, Wallet, Minus, Plus, CheckCircle,
} from 'lucide-react';
import type { Customer, Promo } from '../../types';
import { fmtMoney, initials, type CartItem } from './types';

interface CartPanelProps {
    isMobilePanelOpen: boolean;
    onCloseMobile: () => void;

    customer: Customer | null;
    customerSearch: string;
    onCustomerSearchChange: (value: string) => void;
    isCustomerDropdownOpen: boolean;
    onCustomerDropdownOpenChange: (open: boolean) => void;
    customerResults: Customer[];
    onSelectCustomer: (customer: Customer) => void;
    onClearCustomer: () => void;

    heldOrdersCount: number;
    onHoldOrder: () => void;

    cart: CartItem[];
    onUpdateCartQty: (idx: number, delta: number) => void;

    cartCount: number;
    subtotal: number;

    promo: Promo | null;
    promoInput: string;
    onPromoInputChange: (value: string) => void;
    onApplyPromo: () => void;
    onClearPromo: () => void;
    discountAmount: number;
    finalTotal: number;

    payment: string;
    onPaymentChange: (value: string) => void;
    cashGivenStr: string;
    onCashGivenChange: (value: string) => void;
    cashGiven: number;
    cashChange: number;

    onCancelOrder: () => void;
    checkingOut: boolean;
    onCheckout: () => void;
}

export function CartPanel({
    isMobilePanelOpen, onCloseMobile,
    customer, customerSearch, onCustomerSearchChange, isCustomerDropdownOpen, onCustomerDropdownOpenChange,
    customerResults, onSelectCustomer, onClearCustomer,
    heldOrdersCount, onHoldOrder,
    cart, onUpdateCartQty,
    cartCount, subtotal,
    promo, promoInput, onPromoInputChange, onApplyPromo, onClearPromo, discountAmount, finalTotal,
    payment, onPaymentChange, cashGivenStr, onCashGivenChange, cashGiven, cashChange,
    onCancelOrder, checkingOut, onCheckout,
}: CartPanelProps) {
    return (
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
                                onCustomerSearchChange(e.target.value);
                                if (!customer) onCustomerDropdownOpenChange(true);
                            }}
                            onFocus={() => { if (!customer) onCustomerDropdownOpenChange(true); }}
                            onBlur={() => setTimeout(() => onCustomerDropdownOpenChange(false), 200)}
                            disabled={!!customer}
                        />
                        {customer && (
                            <button className="icon-btn icon-btn--sm" onClick={onClearCustomer}>
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
                                        onClick={() => onSelectCustomer(c)}
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
                <button className="icon-btn icon-btn--sm" title="Tạm giữ / Danh sách giữ" onClick={onHoldOrder}>
                    <Archive size={16} />
                    {heldOrdersCount > 0 && <span className="badge-dot">{heldOrdersCount}</span>}
                </button>
                {isMobilePanelOpen && (
                    <button
                        className="icon-btn icon-btn--sm pos-cart-close-btn"
                        style={{ position: 'absolute', top: 12, right: 12 }}
                        onClick={onCloseMobile}
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
                                <button onClick={() => onUpdateCartQty(idx, -1)}><Minus size={14} /></button>
                                <span>{item.qty}</span>
                                <button onClick={() => onUpdateCartQty(idx, 1)}><Plus size={14} /></button>
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
                                    onChange={e => onPromoInputChange(e.target.value)}
                                />
                                <button className="btn btn--sm btn--ghost" onClick={onApplyPromo}>Áp dụng</button>
                            </div>
                        ) : (
                            <div className="pos-promo-active">
                                <span className="badge badge--success"><Check size={14} /> {promo.code}</span>
                                <button className="icon-btn icon-btn--sm" onClick={onClearPromo}><X size={14} /></button>
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
                    <button className={`pos-pay-btn ${payment === 'Tiền mặt' ? 'active' : ''}`} onClick={() => onPaymentChange('Tiền mặt')}><Banknote size={16} /> Tiền mặt</button>
                    <button className={`pos-pay-btn ${payment === 'Chuyển khoản' ? 'active' : ''}`} onClick={() => onPaymentChange('Chuyển khoản')}><SmartphoneNfc size={16} /> Chuyển khoản</button>
                    <button className={`pos-pay-btn ${payment === 'Thẻ tín dụng' ? 'active' : ''}`} onClick={() => onPaymentChange('Thẻ tín dụng')}><CreditCard size={16} /> Thẻ tín dụng</button>
                    <button className={`pos-pay-btn ${payment === 'Ví MoMo' ? 'active' : ''}`} onClick={() => onPaymentChange('Ví MoMo')}><Wallet size={16} /> Ví MoMo</button>
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
                                        onCashGivenChange(raw ? Number(raw).toLocaleString("vi-VN") : "");
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
                            <button className="badge badge--neutral" onClick={() => onCashGivenChange((cashGiven + 50000).toLocaleString("vi-VN"))}>50k</button>
                            <button className="badge badge--neutral" onClick={() => onCashGivenChange((cashGiven + 100000).toLocaleString("vi-VN"))}>100k</button>
                            <button className="badge badge--neutral" onClick={() => onCashGivenChange((cashGiven + 200000).toLocaleString("vi-VN"))}>200k</button>
                            <button className="badge badge--neutral" onClick={() => onCashGivenChange((cashGiven + 500000).toLocaleString("vi-VN"))}>500k</button>
                            <button className="badge badge--primary" onClick={() => onCashGivenChange(finalTotal.toLocaleString("vi-VN"))}>Đủ tiền</button>
                        </div>
                    </div>
                )}

                <div className="pos-actions">
                    <button className="btn btn--danger-outline" onClick={onCancelOrder}>Hủy đơn</button>
                    <button
                        className="btn btn--primary"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 15 }}
                        disabled={cart.length === 0 || checkingOut || (payment === 'Tiền mặt' && cashChange < 0)}
                        onClick={onCheckout}
                    >
                        <CheckCircle size={18} /> {checkingOut ? 'Đang xử lý…' : 'Thanh toán (F9)'}
                    </button>
                </div>
            </div>
        </div>
    );
}
