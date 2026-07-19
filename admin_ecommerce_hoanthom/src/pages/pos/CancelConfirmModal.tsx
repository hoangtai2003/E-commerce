import { Modal } from '../../components/ui/Modal';

interface CancelConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function CancelConfirmModal({ isOpen, onClose, onConfirm }: CancelConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hủy đơn hàng hiện tại?"
            footer={
                <>
                    <button className="btn btn--ghost" onClick={onClose}>Quay lại</button>
                    <button className="btn btn--danger" onClick={onConfirm}>Xác nhận hủy</button>
                </>
            }
        >
            <p>Bạn có chắc muốn làm trống giỏ hàng hiện tại không?</p>
        </Modal>
    );
}
