import React, { useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/solid';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function Register() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!email || !pwd || !pwd2) { setErr('Vui lòng điền đầy đủ thông tin'); return; }
    if (pwd !== pwd2) { setErr('Mật khẩu nhập lại không khớp'); return; }
    setLoading(true);
    try {
      await register((email || '').split('@')[0] || 'student', email, pwd);
      navigate('/login', { state: { registeredEmail: email } });
    } catch (e) {
      setErr(e.message || 'Lỗi kết nối');
    } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <img
        src="/background.png"
        alt=""
        className="fixed inset-0 -z-10 w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          document.documentElement.style.background =
            'linear-gradient(135deg,#4f46e5,#9333ea,#ec4899)';
        }}
      />
      <div className="fixed inset-0 -z-10 bg-black/20" />

      {/* Nội dung */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg mx-4">
          <div className="auth-card bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-semibold mb-1 text-center">Đăng ký</h2>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base mt-2 bg-white"
                  placeholder="nhập email..."
                />
              </div>

              <div>
                <label className="text-sm text-slate-700">Mật khẩu</label>
                <div className="relative mt-2">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="input-base pr-12 bg-white"
                    placeholder="nhập mật khẩu..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-600"
                    aria-label="Hiện/ẩn mật khẩu"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-700">Nhập lại mật khẩu</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  className="input-base mt-2 bg-white"
                  placeholder="nhập lại mật khẩu..."
                />
              </div>

              {err && <div className="text-sm text-red-600">{err}</div>}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>

              <div className="text-center text-sm text-slate-600">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-emerald-600 font-medium underline-offset-2 hover:underline">
                  Đăng nhập
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
}
