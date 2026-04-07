import React, { useState } from 'react';
import { Bus, Eye, EyeOff, Lock, Loader2, User, Phone, Hash, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupSchemaType } from '../schemas/authSchema';
import { Link, useNavigate } from 'react-router-dom';
import Api from '../services/Api';

interface SignUpProps { onSuccess: (role: "student" | "admin") => void; }

const SignUp: React.FC<SignUpProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'student' }
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: SignupSchemaType) => {
  setLoading(true);
  setServerError(null);
  try {
    const payload: any = {
      name: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role,
      phone_number: data.phone_number,
    };

    
    if (data.role === 'student') {
      payload.student_id = data.student_id;
    }

    const response = await Api.post('/auth/register', payload);
    
    const { token, user } = response.data;

    if (token && user) {
      localStorage.setItem('token', token);
      
      onSuccess(user.role); 

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  } catch (error: any) {
    setServerError(error.response?.data?.message || error.response?.data?.error || 'Registration failed.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-[#0f1115] text-white min-h-screen flex items-center justify-center p-6 font-sans selection:bg-[#f7a01b] selection:text-black">
      
      <div className="w-full max-w-[460px] flex flex-col items-center animate-in">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-[#f7a01b] text-black rounded-[20px] flex items-center justify-center shadow-xl shadow-orange-500/10 transition-transform hover:rotate-3">
            <Bus size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-4">SmartBus</h1>
          <p className="text-[#8a8d91] text-xs uppercase tracking-[3px] mt-1 font-medium">Institutional Portal</p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-[#1c1e26] border border-[#2d3036] p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-1">Create Account</h2>
            <p className="text-[#8a8d91] text-sm">Join the next generation of campus transit</p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium animate-shake">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Role Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0f1115] rounded-2xl mb-4 border border-[#2d3036]">
              {['student', 'admin'].map((role) => (
                <label key={role} className={`
                  flex items-center justify-center py-2.5 rounded-xl cursor-pointer transition-all text-[11px] font-bold uppercase tracking-wider
                  ${selectedRole === role ? 'bg-[#f7a01b] text-black shadow-lg' : 'text-[#8a8d91] hover:text-white'}
                `}>
                  <input type="radio" {...register("role")} value={role} className="hidden" />
                  {role}
                </label>
              ))}
            </div>

            <InputGroup 
              label="Full Name" 
              icon={<User size={18}/>}
              error={errors.fullName?.message}
              inputProps={register("fullName")}
              placeholder="e.g. Ahmed Mohamed"
              disabled={loading}
            />

            <InputGroup 
              label="Institutional Email" 
              icon={<ShieldCheck size={18}/>}
              error={errors.email?.message}
              inputProps={register("email")}
              placeholder="name@university.edu"
              disabled={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InputGroup 
                label="Phone Number" 
                icon={<Phone size={18}/>}
                error={errors.phone_number?.message}
                inputProps={register("phone_number")}
                placeholder="01xxxxxxxxx"
                disabled={loading}
              />
              {selectedRole === 'student' && (
                <InputGroup 
                  label="Student ID" 
                  icon={<Hash size={18}/>}
                  error={errors.student_id?.message}
                  inputProps={register("student_id")}
                  placeholder="ID Number"
                  disabled={loading}
                />
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 group">
              <label className="text-[#8a8d91] text-[11px] font-bold uppercase tracking-wider ml-1">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-[#8a8d91] group-focus-within:text-[#f7a01b] transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  disabled={loading}
                  className="w-full bg-[#262a33] border border-[#2d3036] py-3.5 pl-12 pr-12 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#2d323d] transition-all text-sm placeholder:text-gray-600 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-[#8a8d91] hover:text-white transition-colors">
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{errors.password.message}</p>}
            </div>

            <InputGroup 
              label="Confirm Password" 
              type="password"
              icon={<Lock size={18}/>}
              error={errors.confirmPassword?.message}
              inputProps={register("confirmPassword")}
              placeholder="••••••••"
              disabled={loading}
            />

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#f7a01b] text-black font-bold py-4 rounded-2xl shadow-xl shadow-orange-500/10 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 mt-8"
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : "Create Account"}
            </button>

          </form>

          <div className="mt-8 text-center text-sm border-t border-[#2d3036] pt-6">
            <p className="text-[#8a8d91]">
              Already have an account? 
              <Link to="/login" className="text-[#f7a01b] font-bold hover:underline decoration-2 underline-offset-4 ml-1">Sign In</Link>
            </p>
          </div>
        </div>

        <footer className="mt-10 text-[#8a8d91] text-[10px] font-bold uppercase tracking-[3px] opacity-40">
          SMARTBUS TRANSPORTATION SYSTEM © 2026
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
        .animate-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        
        /* Custom Scrollbar for the whole page */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0f1115; }
        ::-webkit-scrollbar-thumb { background: #2d3036; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #f7a01b; }
      `}</style>
    </div>
  );
};

const InputGroup: React.FC<{label: string, placeholder: string, type?: string, inputProps: any, error?: string, icon?: React.ReactNode, disabled?: boolean}> = ({ label, placeholder, type = "text", inputProps, error, icon, disabled }) => (
  <div className="space-y-1.5 group">
    <label className="text-[#8a8d91] text-[11px] font-bold uppercase tracking-wider ml-1">{label}</label>
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-4 text-[#8a8d91] group-focus-within:text-[#f7a01b] transition-colors font-bold">
          {icon}
        </div>
      )}
      <input 
        type={type}
        placeholder={placeholder}
        {...inputProps}
        disabled={disabled}
        className={`w-full bg-[#262a33] border border-[#2d3036] py-3.5 ${icon ? 'pl-12' : 'px-4'} pr-4 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#2d323d] transition-all text-sm placeholder:text-gray-600 disabled:opacity-50`} 
      />
    </div>
    {error && (
      <p className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{error}</p>
    )}
  </div>
);

export default SignUp;