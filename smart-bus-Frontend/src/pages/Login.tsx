import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchemaType } from '../schemas/authSchema';
import Api from '../services/Api';

interface LoginProps { 
  onSuccess: (role: "student" | "admin") => void; 
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
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
  
  console.log("Data being sent to backend:", data); 

  try {
    const response = await Api.post('/auth/login', data);
    
    console.log("Success Response:", response.data); 

    const { token, user } = response.data;
    if (token) {
      localStorage.setItem('token', token);
      onSuccess(user.role); 
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  } catch (error: any) {
    console.log("Full Error Object:", error);
    console.log("Backend Error Message:", error.response?.data); 

    setServerError(error.response?.data?.message || 'Invalid email or password');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-[#0f1115] text-white min-h-screen flex items-center justify-center p-6 font-sans selection:bg-[#f7a01b] selection:text-black">
      
      <div className="w-full max-w-[420px] flex flex-col items-center">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center mb-8 animate-in">
          <Link to="/welcome" className="w-16 h-16 bg-[#f7a01b] text-black rounded-[20px] flex items-center justify-center shadow-xl shadow-orange-500/10 transition-transform hover:scale-105 active:scale-95">
            <Bus size={32} fill="currentColor" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight mt-4">SmartBus</h1>
          <p className="text-[#8a8d91] text-xs uppercase tracking-[3px] mt-1 font-medium">Welcome Back</p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-[#1c1e26] border border-[#2d3036] p-8 md:p-10 rounded-[32px] shadow-2xl animate-in delay-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Sign In</h2>
            <p className="text-[#8a8d91] text-sm font-medium">Access your institutional portal</p>
          </div>

          {/* Error Message */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium animate-shake">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-1.5 group">
              <label className="text-[#8a8d91] text-[11px] font-bold uppercase tracking-wider ml-1">
                Institutional Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-[#8a8d91] group-focus-within:text-[#f7a01b] transition-colors" size={18} />
                <input 
                  type="email"
                  placeholder="name@university.edu"
                  {...register("email")}
                  disabled={loading}
                  className="w-full bg-[#262a33] border border-[#2d3036] py-3.5 pl-12 pr-4 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#2d323d] transition-all text-sm placeholder:text-gray-600 disabled:opacity-50"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 group">
              <label className="text-[#8a8d91] text-[11px] font-bold uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-[#8a8d91] group-focus-within:text-[#f7a01b] transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  {...register("password")}
                  disabled={loading}
                  className="w-full bg-[#262a33] border border-[#2d3036] py-3.5 pl-12 pr-12 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#2d323d] transition-all text-sm placeholder:text-gray-600 disabled:opacity-50"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#8a8d91] hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#f7a01b] text-black font-bold py-4 rounded-2xl mt-4 shadow-xl shadow-orange-500/10 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : "Sign In"}
            </button>
          </form>

          {/* Link to Signup */}
          <div className="mt-8 text-center text-sm border-t border-[#2d3036] pt-6">
            <p className="text-[#8a8d91]">
              New to SmartBus? 
              <Link to="/signup" className="text-[#f7a01b] font-bold hover:underline decoration-2 underline-offset-4 ml-1">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <footer className="mt-10 text-[#8a8d91] text-[10px] font-bold uppercase tracking-[3px] opacity-40">
          SmartBus Transportation System © 2026
        </footer>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default Login;