import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/');
        } catch {
            showToast('error', 'Đăng nhập thất bại', 'Email hoặc mật khẩu không đúng.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="card login-card">
                <div className="login-header">
                    <div className="brand-mark">
                        <Command size={24} />
                    </div>
                    <h2>Chào mừng trở lại</h2>
                    <p className="page-sub">Đăng nhập vào hệ thống quản lý</p>
                </div>
                <form className="form" onSubmit={handleLogin}>
                    <label className="field">
                        <span>Email</span>
                        <input
                            type="email"
                            className="input"
                            placeholder="admin@aurora.vn"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </label>
                    <label className="field">
                        <span>Mật khẩu</span>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-2)', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} /> Nhớ đăng nhập
                        </label>
                        <a href="#" className="link-btn" onClick={e => e.preventDefault()}>Quên mật khẩu?</a>
                    </div>
                    <button type="submit" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} disabled={submitting}>
                        {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}
