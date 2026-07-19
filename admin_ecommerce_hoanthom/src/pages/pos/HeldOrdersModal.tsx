import { Clock, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import type { HeldOrder } from './types';

interface HeldOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    heldOrders: HeldOrder[];
    onRemove: (idx: number) => void;
    onRestore: (idx: number) => void;
}

export function HeldOrdersModal({ isOpen, onClose, heldOrders, onRemove, onRestore }: HeldOrdersModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Danh sách đơn tạm giữ">
            {heldOrders.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
                    <div>
                        <strong>{h.name}</strong>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                            <Clock size={12} style={{ verticalAlign: -2 }} /> {h.time} · {h.cart.length} món
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn icon-btn--sm" onClick={() => onRemove(i)}>
                            <Trash2 size={16} />
                        </button>
                        <button className="btn btn--sm btn--primary" onClick={() => onRestore(i)}>
                            Nạp lại
                        </button>
                    </div>
                </div>
            ))}
            {heldOrders.length === 0 && <p style={{ color: 'var(--text-3)' }}>Không có đơn tạm giữ.</p>}
        </Modal>
    );
}
