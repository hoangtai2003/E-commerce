import type { RefObject } from 'react';
import { Search } from 'lucide-react';
import { fmtMoney, type PosProduct } from './types';

interface ProductGridProps {
    searchInputRef: RefObject<HTMLInputElement | null>;
    search: string;
    onSearchChange: (value: string) => void;
    category: string;
    onCategoryChange: (value: string) => void;
    categories: { id: number; name: string }[];
    loading: boolean;
    filteredProducts: PosProduct[];
    onProductClick: (product: PosProduct) => void;
}

export function ProductGrid({
    searchInputRef, search, onSearchChange, category, onCategoryChange,
    categories, loading, filteredProducts, onProductClick,
}: ProductGridProps) {
    return (
        <div className="pos-left">
            <div className="pos-toolbar">
                <div className="search search--full">
                    <Search size={18} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Tìm theo tên hoặc biến thể (Nhấn Esc để xóa)…"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                </div>
                <div className="pos-categories">
                    <button
                        className={`badge ${category === 'all' ? 'badge--primary active' : 'badge--neutral'}`}
                        onClick={() => onCategoryChange('all')}
                    >
                        Tất cả
                    </button>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            className={`badge ${category === c.name ? 'badge--primary active' : 'badge--neutral'}`}
                            onClick={() => onCategoryChange(c.name)}
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
                                onClick={() => { if (!disabled) onProductClick(p); }}
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
    );
}
