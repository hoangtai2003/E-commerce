import { CheckCircle, Printer } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { fmtMoney, type LastOrderSummary } from './types';

interface SuccessModalProps {
    lastOrder: LastOrderSummary | null;
    onClose: () => void;
}

export function SuccessModal({ lastOrder, onClose }: SuccessModalProps) {
    return (
        <Modal
            isOpen={!!lastOrder}
            onClose={onClose}
            title=""
            footer={
                <div style={{ display: 'flex', width: '100%', justifyContent: 'center', gap: 12 }}>
                    <button className="btn btn--ghost" onClick={() => window.print()}><Printer size={18} /> In hóa đơn</button>
                    <button className="btn btn--primary" onClick={onClose}>Đơn mới</button>
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
    );
}
