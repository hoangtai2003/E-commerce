import { Modal } from '../../components/ui/Modal';
import { fmtMoney, type PosProduct, type PosVariant } from './types';

interface VariantModalProps {
    product: PosProduct | null;
    onClose: () => void;
    onSelectVariant: (product: PosProduct, variant: PosVariant) => void;
}

export function VariantModal({ product, onClose, onSelectVariant }: VariantModalProps) {
    return (
        <Modal isOpen={!!product} onClose={onClose} title={product?.name || ""}>
            <p style={{ marginBottom: 12, color: 'var(--text-2)' }}>Chọn biến thể:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product?.variants.map((v) => {
                    const disabled = v.stock === 0;
                    return (
                        <button
                            key={v.id}
                            className={`btn ${disabled ? 'btn--ghost' : 'btn--primary'}`}
                            disabled={disabled}
                            onClick={() => onSelectVariant(product, v)}
                        >
                            {v.label} — {fmtMoney(v.price)} (Tồn: {v.stock})
                        </button>
                    );
                })}
            </div>
        </Modal>
    );
}
