import { useState, useMemo, useEffect, useRef } from 'react';
import type { Customer, Promo } from '../types';
import { getCategories } from '../services/categories';
import { getProducts, type ApiProduct } from '../services/products';
import { getProductVariants, type ApiProductVariant } from '../services/productVariants';
import { getProductImages, type ApiProductImage } from '../services/productImages';
import { getCustomers } from '../services/customers';
import { getPromotions } from '../services/promotions';
import { createOrder } from '../services/orders';
import { useToast } from '../contexts/ToastContext';
import { useOrders } from '../contexts/OrdersContext';
import {
    fmtMoney, PAYMENT_METHOD_MAP, variantLabel,
    type PosProduct, type PosVariant, type CartItem, type HeldOrder, type LastOrderSummary,
} from './pos/types';
import { ProductGrid } from './pos/ProductGrid';
import { CartPanel } from './pos/CartPanel';
import { VariantModal } from './pos/VariantModal';
import { CancelConfirmModal } from './pos/CancelConfirmModal';
import { SuccessModal } from './pos/SuccessModal';
import { HeldOrdersModal } from './pos/HeldOrdersModal';

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

    const handleProductClick = (p: PosProduct) => {
        if (p.variants.length === 1) addToCart(p, p.variants[0]);
        else if (p.variants.length > 1) setVariantProduct(p);
    };

    const handleSelectVariant = (product: PosProduct, variant: PosVariant) => {
        addToCart(product, variant);
        setVariantProduct(null);
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

    const handleSelectCustomer = (c: Customer) => {
        setCustomer(c);
        setCustomerSearch(`${c.name} - ${c.phone}`);
        setIsCustomerDropdownOpen(false);
    };

    const handleClearCustomer = () => {
        setCustomer(null);
        setCustomerSearch("");
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

    const handleCancelOrder = () => {
        if (cart.length > 0) setIsCancelConfirmOpen(true);
    };

    const handleCloseSuccessModal = () => {
        setLastOrder(null);
        searchInputRef.current?.focus();
    };

    return (
        <section className="page active" id="page-pos" data-title="Bán hàng">
            <div className="pos-layout">
                <ProductGrid
                    searchInputRef={searchInputRef}
                    search={search}
                    onSearchChange={setSearch}
                    category={category}
                    onCategoryChange={setCategory}
                    categories={categories}
                    loading={loading}
                    filteredProducts={filteredProducts}
                    onProductClick={handleProductClick}
                />

                <CartPanel
                    isMobilePanelOpen={isMobilePanelOpen}
                    onCloseMobile={() => setIsMobilePanelOpen(false)}
                    customer={customer}
                    customerSearch={customerSearch}
                    onCustomerSearchChange={setCustomerSearch}
                    isCustomerDropdownOpen={isCustomerDropdownOpen}
                    onCustomerDropdownOpenChange={setIsCustomerDropdownOpen}
                    customerResults={customerResults}
                    onSelectCustomer={handleSelectCustomer}
                    onClearCustomer={handleClearCustomer}
                    heldOrdersCount={heldOrders.length}
                    onHoldOrder={handleHoldOrder}
                    cart={cart}
                    onUpdateCartQty={updateCartQty}
                    cartCount={cartCount}
                    subtotal={subtotal}
                    promo={promo}
                    promoInput={promoInput}
                    onPromoInputChange={setPromoInput}
                    onApplyPromo={applyPromo}
                    onClearPromo={() => setPromo(null)}
                    discountAmount={discountAmount}
                    finalTotal={finalTotal}
                    payment={payment}
                    onPaymentChange={setPayment}
                    cashGivenStr={cashGivenStr}
                    onCashGivenChange={setCashGivenStr}
                    cashGiven={cashGiven}
                    cashChange={cashChange}
                    onCancelOrder={handleCancelOrder}
                    checkingOut={checkingOut}
                    onCheckout={handleCheckout}
                />
            </div>

            {/* MOBILE TOGGLE */}
            <div className="pos-mobile-toggle" onClick={() => setIsMobilePanelOpen(true)}>
                <span>Giỏ hàng ({cartCount} món)</span>
                <strong>{fmtMoney(finalTotal)}</strong>
            </div>

            <VariantModal
                product={variantProduct}
                onClose={() => setVariantProduct(null)}
                onSelectVariant={handleSelectVariant}
            />

            <CancelConfirmModal
                isOpen={isCancelConfirmOpen}
                onClose={() => setIsCancelConfirmOpen(false)}
                onConfirm={() => { resetCart(); setIsCancelConfirmOpen(false); }}
            />

            <SuccessModal lastOrder={lastOrder} onClose={handleCloseSuccessModal} />

            <HeldOrdersModal
                isOpen={isHeldListOpen}
                onClose={() => setIsHeldListOpen(false)}
                heldOrders={heldOrders}
                onRemove={idx => setHeldOrders(heldOrders.filter((_, i) => i !== idx))}
                onRestore={restoreHoldOrder}
            />
        </section>
    );
}
