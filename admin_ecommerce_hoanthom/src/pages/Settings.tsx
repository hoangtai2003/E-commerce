import { useState } from 'react';
import { Store, Palette, BellRing } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';

interface MainLayoutContext {
    isDarkMode: boolean;
    toggleTheme: () => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export function Settings() {
    const { showToast } = useToast();
    const { isDarkMode, toggleTheme, isCollapsed, toggleCollapse } = useOutletContext<MainLayoutContext>();
    const [showResetModal, setShowResetModal] = useState(false);

    return (
        <section className="page active" id="page-settings" data-title="Cài đặt">
            <div className="page-head">
                <div>
                    <h1>Cài đặt</h1>
                    <p className="page-sub">Cấu hình cửa hàng và tuỳ chọn hệ thống.</p>
                </div>
            </div>

            <div className="settings-grid">
                <div className="card settings-card">
                    <div className="card__head">
                        <h3><Store size={18} /> Thông tin cửa hàng</h3>
                    </div>
                    <form className="form" onSubmit={e => { e.preventDefault(); showToast('success', 'Đã lưu cài đặt', 'Thông tin cửa hàng đã được cập nhật.'); }}>
                        <div className="form-row">
                            <label className="field">
                                <span>Tên cửa hàng</span>
                                <input type="text" className="input" defaultValue="Aurora Store" />
                            </label>
                            <label className="field">
                                <span>Email liên hệ</span>
                                <input type="email" className="input" defaultValue="hello@aurora.vn" />
                            </label>
                        </div>
                        <div className="form-row">
                            <label className="field">
                                <span>Số điện thoại</span>
                                <input type="tel" className="input" defaultValue="0901 234 567" />
                            </label>
                            <label className="field">
                                <span>Đơn vị tiền tệ</span>
                                <select className="select select--full">
                                    <option>VND — Việt Nam Đồng</option>
                                    <option>USD — US Dollar</option>
                                </select>
                            </label>
                        </div>
                        <label className="field">
                            <span>Địa chỉ</span>
                            <input type="text" className="input" defaultValue="125 Xuân Thủy, Cầu Giấy, Hà Nội" />
                        </label>
                        <div className="form-actions">
                            <button type="submit" className="btn btn--primary" onClick={(e) => { e.preventDefault(); showToast('success', 'Đã cập nhật tùy chọn hiển thị'); }}>Lưu thay đổi</button>
                        </div>
                    </form>
                </div>

                <div className="card settings-card">
                    <div className="card__head">
                        <h3><Palette size={18} /> Giao diện</h3>
                    </div>
                    <div className="setting-row">
                        <div>
                            <strong>Chế độ tối</strong>
                            <p>Giảm mỏi mắt khi làm việc ban đêm.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                            <span className="switch__track"></span>
                        </label>
                    </div>
                    <div className="setting-row">
                        <div>
                            <strong>Thu gọn sidebar mặc định</strong>
                            <p>Hiển thị nhiều nội dung hơn trên màn hình.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={isCollapsed} onChange={toggleCollapse} />
                            <span className="switch__track"></span>
                        </label>
                    </div>

                    <div className="card__head" style={{ marginTop: 20 }}>
                        <h3><BellRing size={18} /> Thông báo</h3>
                    </div>
                    <div className="setting-row">
                        <div>
                            <strong>Đơn hàng mới</strong>
                            <p>Nhận thông báo khi có đơn hàng mới.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="switch__track"></span>
                        </label>
                    </div>
                    <div className="setting-row">
                        <div>
                            <strong>Cảnh báo tồn kho</strong>
                            <p>Nhắc khi sản phẩm sắp hết hàng.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="switch__track"></span>
                        </label>
                    </div>

                    <div className="danger-zone">
                        <div>
                            <strong>Đặt lại dữ liệu demo</strong>
                            <p>Khôi phục toàn bộ dữ liệu mẫu về trạng thái ban đầu.</p>
                        </div>
                        <button className="btn btn--danger-outline" onClick={() => setShowResetModal(true)}>Đặt lại</button>
                    </div>
                </div>
            </div>

            <Modal 
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                title="Đặt lại dữ liệu demo?"
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn--ghost" onClick={() => setShowResetModal(false)}>Hủy bỏ</button>
                        <button className="btn btn--danger" onClick={() => {
                            showToast('success', 'Đã khôi phục dữ liệu gốc', 'Toàn bộ dữ liệu mẫu đã được đặt lại.');
                            setShowResetModal(false);
                        }}>Đặt lại</button>
                    </div>
                }
            >
                <p style={{ color: 'var(--text-2)' }}>
                    Mọi thay đổi bạn đã thực hiện (sản phẩm, đơn hàng, mã giảm giá...) sẽ trở về trạng thái mẫu ban đầu.
                </p>
            </Modal>
        </section>
    );
}
