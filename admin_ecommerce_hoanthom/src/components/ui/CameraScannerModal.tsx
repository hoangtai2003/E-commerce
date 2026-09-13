import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from './Modal';

const SCANNER_ELEMENT_ID = 'camera-scanner-viewport';
const RESCAN_COOLDOWN_MS = 2000;

interface CameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDetected: (code: string) => void;
}

export function CameraScannerModal({ isOpen, onClose, onDetected }: CameraScannerModalProps) {
    const [error, setError] = useState<string | null>(null);
    // Modal render div#camera-scanner-viewport 1 nhịp sau khi isOpen bật (do Modal tự trì hoãn
    // mount qua state shouldRender) — dùng callback ref để biết chắc div đã có trong DOM thật
    // trước khi khởi tạo Html5Qrcode, tránh lỗi "element not found".
    const [viewportReady, setViewportReady] = useState(false);
    const viewportCallbackRef = (node: HTMLDivElement | null) => setViewportReady(!!node);
    const lastCodeRef = useRef<string | null>(null);
    const lastTimeRef = useRef(0);

    // onDetected là hàm mới mỗi lần POS.tsx re-render (không useCallback) — nếu đưa thẳng vào
    // dependency của effect bên dưới, camera sẽ bị dừng/khởi động lại liên tục theo mỗi lần
    // parent render, không liên quan gì đến việc mở/đóng modal. Dùng ref để luôn gọi được bản
    // callback mới nhất mà không cần effect phụ thuộc vào nó.
    const onDetectedRef = useRef(onDetected);
    useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

    useEffect(() => {
        if (!isOpen || !viewportReady) return;

        setError(null);
        let cancelled = false;
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });

        scanner
            .start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 280, height: 160 } },
                decodedText => {
                    if (cancelled) return;
                    const now = Date.now();
                    // Chặn báo trùng liên tục khi mã vẫn còn trong khung hình — chỉ báo lại
                    // đúng mã đó sau ít nhất 2s, nhưng mã KHÁC thì luôn báo ngay để quét liên tiếp
                    // nhiều sản phẩm không bị chặn nhầm.
                    if (decodedText === lastCodeRef.current && now - lastTimeRef.current < RESCAN_COOLDOWN_MS) {
                        return;
                    }
                    lastCodeRef.current = decodedText;
                    lastTimeRef.current = now;
                    onDetectedRef.current(decodedText);
                },
                () => {
                    // Lỗi giải mã từng khung hình — xảy ra liên tục khi chưa có mã nào trong
                    // khung hình, không phải lỗi thật, bỏ qua.
                }
            )
            .catch(() => {
                if (!cancelled) {
                    setError('Không thể mở camera. Kiểm tra quyền truy cập camera của trình duyệt và thử lại.');
                }
            });

        return () => {
            cancelled = true;
            try {
                scanner.stop().then(() => scanner.clear()).catch(() => {});
            } catch {
                // scanner chưa kịp start xong (đang giữa init) thì stop() sẽ throw đồng bộ —
                // không có gì để dọn, bỏ qua.
            }
        };
    }, [isOpen, viewportReady]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quét mã bằng camera">
            {error ? (
                <div className="empty-state">
                    <strong>{error}</strong>
                </div>
            ) : (
                <div id={SCANNER_ELEMENT_ID} ref={viewportCallbackRef} style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }} />
            )}
            <p className="cell-muted" style={{ marginTop: 10, textAlign: 'center' }}>
                Đưa mã vạch/QR vào giữa khung hình — hệ thống sẽ tự nhận diện và thêm vào giỏ.
            </p>
        </Modal>
    );
}
