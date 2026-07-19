import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    size?: 'lg' | 'md' | 'sm';
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, size, children, footer }: ModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
        } else if (shouldRender) {
            setIsClosing(true);
            setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
                document.body.style.overflow = '';
            }, 250); // Matches var(--ease) modal-out duration (0.22s approx)
        }
    }, [isOpen, shouldRender]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!shouldRender) return null;

    const modalRoot = document.getElementById('modalRoot') || document.body;
    const sizeClass = size === 'lg' ? 'modal__dialog--lg' : '';

    return createPortal(
        <div className={`modal-root open ${isClosing ? 'closing' : ''}`}>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal" role="dialog" aria-modal="true">
                <div className={`modal__dialog ${sizeClass}`}>
                    <div className="modal__head">
                        <h3>{title}</h3>
                        <button className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Đóng">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                    <div className="modal__body">
                        {children}
                    </div>
                    {footer && (
                        <div className="modal__foot">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        modalRoot
    );
}
