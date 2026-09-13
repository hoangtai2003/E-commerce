import { useState, useMemo } from 'react';
import { Search, X, Printer } from 'lucide-react';
import type { ApiProduct } from '../../services/products';
import type { ApiProductVariant } from '../../services/productVariants';
import { Modal } from '../../components/ui/Modal';
import { Barcode } from '../../components/ui/Barcode';

const fmtMoney = (n: number) => n.toLocaleString('vi-VN') + '₫';
const variantLabel = (v: ApiProductVariant) => v.variant_name || [v.size, v.color].filter(Boolean).join(' / ') || v.sku;

interface PrintLine {
    variantId: number;
    productName: string;
    variantName: string;
    sku: string;
    price: number;
    quantity: string;
}

interface PrintBarcodesModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiProducts: ApiProduct[];
    apiVariants: ApiProductVariant[];
}

export function PrintBarcodesModal({ isOpen, onClose, apiProducts, apiVariants }: PrintBarcodesModalProps) {
    const [search, setSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [lines, setLines] = useState<PrintLine[]>([]);

    const productById = useMemo(() => new Map(apiProducts.map(p => [p.id, p])), [apiProducts]);

    const searchResults = useMemo(() => {
        if (!search.trim()) return [];
        const q = search.toLowerCase().trim();
        const usedIds = new Set(lines.map(l => l.variantId));
        return apiVariants
            .filter(v => !usedIds.has(v.id))
            .filter(v => {
                const product = productById.get(v.product);
                return v.sku.toLowerCase().includes(q) || (product?.name.toLowerCase() ?? '').includes(q) || variantLabel(v).toLowerCase().includes(q);
            })
            .slice(0, 8);
    }, [apiVariants, search, lines, productById]);

    const handleAddVariant = (v: ApiProductVariant) => {
        const product = productById.get(v.product);
        setLines(prev => [...prev, {
            variantId: v.id,
            productName: product?.name ?? '—',
            variantName: variantLabel(v),
            sku: v.sku,
            price: v.price,
            quantity: '1',
        }]);
        setSearch('');
        setIsDropdownOpen(false);
    };

    const handleRemoveLine = (variantId: number) => {
        setLines(prev => prev.filter(l => l.variantId !== variantId));
    };

    const handleClose = () => {
        setSearch('');
        setLines([]);
        onClose();
    };

    const labels = lines.flatMap(line =>
        Array.from({ length: Math.max(1, Number(line.quantity) || 1) }, (_, i) => ({ ...line, key: `${line.variantId}-${i}` }))
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="In mã vạch sản phẩm"
            size="lg"
            footer={
                <>
                    <button className="btn btn--ghost" onClick={handleClose}>Đóng</button>
                    <button className="btn btn--primary" onClick={() => window.print()} disabled={labels.length === 0}>
                        <Printer size={16} /> In ({labels.length} tem)
                    </button>
                </>
            }
        >
            <div className="dropdown" style={{ width: '100%' }}>
                <label className="field">
                    <span>Thêm sản phẩm cần in mã vạch</span>
                    <div className="search search--full">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên sản phẩm hoặc SKU…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setIsDropdownOpen(true); }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                        />
                    </div>
                </label>
                {isDropdownOpen && search && (
                    <div className="dropdown__panel" style={{ opacity: 1, pointerEvents: 'auto', display: 'block', position: 'relative' }}>
                        {searchResults.length > 0 ? (
                            searchResults.map(v => {
                                const product = productById.get(v.product);
                                return (
                                    <div key={v.id} className="dropdown__item" style={{ cursor: 'pointer' }} onClick={() => handleAddVariant(v)}>
                                        <div style={{ lineHeight: 1.3 }}>
                                            <strong>{product?.name ?? '—'} — {variantLabel(v)}</strong>
                                            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{v.sku} · {fmtMoney(v.price)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: 10, fontSize: 12.5, color: 'var(--text-3)' }}>Không tìm thấy sản phẩm khớp từ khoá.</div>
                        )}
                    </div>
                )}
            </div>

            {lines.length > 0 && (
                <div className="field" style={{ marginTop: 14 }}>
                    <span>Danh sách in ({lines.length} sản phẩm, {labels.length} tem)</span>
                    <div className="variant-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {lines.map(line => (
                            <div key={line.variantId} className="variant-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ fontSize: 13.5 }}>{line.productName}</strong>
                                    <div className="cell-sub">{line.variantName} · {line.sku} · {fmtMoney(line.price)}</div>
                                </div>
                                <label style={{ display: 'flex', flexDirection: 'column', fontSize: 11, color: 'var(--text-3)' }}>
                                    Số tem
                                    <input
                                        className="input"
                                        type="number"
                                        min={1}
                                        value={line.quantity}
                                        onChange={e => setLines(prev => prev.map(l => (l.variantId === line.variantId ? { ...l, quantity: e.target.value } : l)))}
                                        style={{ width: 70 }}
                                    />
                                </label>
                                <button type="button" className="icon-btn icon-btn--sm" onClick={() => handleRemoveLine(line.variantId)}>
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {labels.length > 0 && (
                <div className="field" style={{ marginTop: 14 }}>
                    <span>Xem trước tem</span>
                    <div className="barcode-print-area barcode-grid">
                        {labels.map(label => (
                            <div className="barcode-label" key={label.key}>
                                <strong className="barcode-label__name">{label.productName}</strong>
                                {label.variantName && <span className="barcode-label__variant">{label.variantName}</span>}
                                <Barcode value={label.sku} height={40} fontSize={11} />
                                <span className="barcode-label__price">{fmtMoney(label.price)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}
