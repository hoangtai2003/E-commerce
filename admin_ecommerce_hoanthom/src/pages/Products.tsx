import { useState, useMemo } from 'react';
import { Plus, Search, ChevronsUpDown, ChevronUp, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockProducts, CATEGORIES } from '../data/mock';
import type { Product } from '../types';
import { useToast } from '../contexts/ToastContext';

const PRODUCT_STATUS: Record<string, { label: string, tone: string }> = {
  active: { label: "Đang bán", tone: "success" },
  low:    { label: "Sắp hết",  tone: "warning" },
  out:    { label: "Hết hàng", tone: "danger" },
  hidden: { label: "Đang ẩn",  tone: "neutral" },
};

const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

export function Products() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortKey, setSortKey] = useState<keyof Product>('sold');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [page, setPage] = useState(1);
  const per = 6;

  const filteredProducts = useMemo(() => {
    let rows = mockProducts.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || p.category === category;
      const matchStatus = status === 'all' || p.status === status;
      return matchSearch && matchCat && matchStatus;
    });

    rows.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb, "vi") * sortDir;
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * sortDir;
      }
      return 0;
    });

    return rows;
  }, [search, category, status, sortKey, sortDir]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / per));
  const currentRows = filteredProducts.slice((page - 1) * per, page * per);

  const handleSort = (key: keyof Product) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Product }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown size={14} />;
    return sortDir === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <section className="page active" id="page-products" data-title="Sản phẩm">
      <div className="page-head">
        <div>
          <h1>Sản phẩm</h1>
          <p className="page-sub">Quản lý kho hàng, danh mục và biến thể.</p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--primary" onClick={() => showToast('info', 'Chức năng thêm sản phẩm sẽ ra mắt sớm.')}>
            <Plus size={18} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search search--table">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc SKU…" 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="toolbar__filters">
            <select className="select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              <option value="all">Tất cả danh mục</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="low">Sắp hết hàng</option>
              <option value="out">Hết hàng</option>
              <option value="hidden">Đang ẩn</option>
            </select>
          </div>
        </div>
        
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('name')}>Sản phẩm <SortIcon columnKey="name" /></th>
                <th>Danh mục</th>
                <th className="sortable" onClick={() => handleSort('price')}>Giá <SortIcon columnKey="price" /></th>
                <th className="sortable" onClick={() => handleSort('stock')}>Tồn kho <SortIcon columnKey="stock" /></th>
                <th className="sortable" onClick={() => handleSort('sold')}>Đã bán <SortIcon columnKey="sold" /></th>
                <th>Trạng thái</th>
                <th className="th-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <strong>Không tìm thấy sản phẩm</strong>
                      <p>Thử đổi từ khoá hoặc xoá bớt bộ lọc để xem thêm kết quả.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRows.map(p => {
                  const s = PRODUCT_STATUS[p.status];
                  const stockPct = Math.min(100, Math.round((p.stock / 120) * 100));
                  const stockColor = p.stock === 0 ? "var(--danger)" : p.stock <= 15 ? "var(--warning)" : "var(--success)";
                  return (
                    <tr key={p.id}>
                      <td data-label="Sản phẩm">
                        <div className="cell-product">
                          <div className="cell-product__thumb" style={{ background: p.tint }}>{p.emoji}</div>
                          <div>
                            <strong>{p.name}</strong>
                            <small>SKU: {p.sku} · {p.variants.length} biến thể</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Danh mục"><span className="badge badge--primary">{p.category}</span></td>
                      <td data-label="Giá" className="cell-money">{fmtMoney(p.price)}</td>
                      <td data-label="Tồn kho" className="stock-cell">
                        <span style={{ fontWeight: 600 }}>{p.stock}</span>
                        <div className="stock-bar">
                          <span style={{ width: `${stockPct}%`, background: stockColor }}></span>
                        </div>
                      </td>
                      <td data-label="Đã bán" className="cell-muted">{p.sold}</td>
                      <td data-label="Trạng thái"><span className={`badge badge--${s.tone}`}>{s.label}</span></td>
                      <td data-label="" className="td-actions">
                        <button className="icon-btn icon-btn--sm" title="Sửa"><Pencil size={16} /></button>
                        <button className="icon-btn icon-btn--sm" title="Xóa"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="table-foot">
          <p className="table-count">
            {totalItems > 0 ? `Hiển thị ${(page - 1) * per + 1}–${Math.min(page * per, totalItems)} trong ${totalItems} sản phẩm` : "0 sản phẩm"}
          </p>
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
