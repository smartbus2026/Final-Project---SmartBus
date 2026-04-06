import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchemaType } from '../schemas/authSchema';
import Api from '../services/Api';
import { useAuth } from '../context/AuthContext';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setLoading(true);
    setServerError(null);

    console.log("Admin login data:", data);

    try {
      const response = await Api.post('/auth/login', data);

      console.log("Admin login response:", response.data);

      const { token, user } = response.data;

      if (token && user.role === 'admin') {
        login(token, user.role);
        localStorage.setItem('userRole', 'admin');
        navigate('/admin/dashboard');
      } else {
        setServerError('Access denied. Admin accounts only.');
      }
    } catch (error: any) {
      console.log("Admin login error:", error.response?.data);
      setServerError(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0f1115] text-white min-h-screen flex items-center justify-center p-6 font-sans selection:bg-[#f7a01b] selection:text-black">

      <div className="w-full max-w-[420px] flex flex-col items-center">

        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Link to="/" className="w-16 h-16 bg-[#f7a01b] text-black rounded-[18px] flex items-center justify-center text-2xl mb-4 shadow-lg shadow-orange-500/10 transition-transform hover:scale-105">
            <Bus size={32} fill="currentColor" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">SmartBus</h1>
          <p className="text-[#8a8d91] text-sm uppercase tracking-widest mt-1">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#1c1e26] border border-[#2d3036] p-10 rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-1 text-white">Welcome back</h2>
            <p className="text-[#8a8d91] text-sm">Sign in with your admin account</p>
          </div>

          {/* Error Message */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[#8a8d91] text-xs font-semibold uppercase tracking-wider ml-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-[#8a8d91]" size={18} />
                <input
                  type="email"
                  placeholder="admin@university.edu"
                  {...register("email")}
                  disabled={loading}
                  className="w-full bg-[#262a33] border border-[#2d3036] py-3.5 pl-12 pr-4 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#f7a01b]/[0.02] transition-all text-sm placeholder:text-gray-600 disabled:opacity-50"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[#8a8d91] text-xs font-semibold uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-[#8a8d91]" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  {...register("password")}
                  disabled={loading}
                  className="w-full bg-[#262a33] border border-[#2d3036] py-3.5 pl-12 pr-12 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#f7a01b]/[0.02] transition-all text-sm placeholder:text-gray-600 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#8a8d91] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f7a01b] text-black font-bold py-4 rounded-xl mt-4 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/5 flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm">
            <p className="text-[#8a8d91]">
              Not an admin?
              <Link to="/login" className="text-[#f7a01b] font-semibold hover:underline decoration-2 underline-offset-4 ml-1">
                Student Login
              </Link>
            </p>
          </div>
        </div>

        <footer className="mt-10 text-[#8a8d91] text-[10px] uppercase tracking-[2px] opacity-60">
          SmartBus Transportation System © 2026
        </footer>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AdminLogin;