import React, { useState } from 'react';
import { Bus, Eye, EyeOff, Lock } from 'lucide-react';import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupSchemaType } from '../schemas/authSchema';
import { Link } from 'react-router-dom';

const SignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = (data: SignupSchemaType) => {
    console.log('Form Submitted:', data);
  };

  return (
    <div className="bg-[#0f1115] text-white min-h-screen flex items-center justify-center p-4 font-sans selection:bg-[#f7a01b] selection:text-black">
      
      <div className="w-full max-w-[440px] flex flex-col items-center">
        
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 bg-[#f7a01b] text-black rounded-[16px] flex items-center justify-center text-xl mb-3 shadow-lg shadow-orange-500/10 transition-transform hover:scale-105">
            <Bus size={28} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SmartBus</h1>
          <p className="text-[#8a8d91] text-xs uppercase tracking-widest mt-1">Student Portal</p>
        </div>

        {/* Form */}
        <div className="w-full bg-[#1c1e26] border border-[#2d3036] p-8 md:p-10 rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-xl font-bold mb-1">Create Account</h2>
            <p className="text-[#8a8d91] text-sm">Join our institutional transportation system</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="signup-scroll max-h-[380px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">

            <InputGroup 
              label="Full Name"
              error={errors.fullName?.message}
              inputProps={register("fullName")}
              placeholder="Enter your full name"
            />

            <InputGroup 
              label="Institutional Email"
              error={errors.email?.message}
              inputProps={register("email")}
              placeholder="name@university.edu"
            />
<div className="space-y-1.5">
  <label className="text-[#8a8d91] text-xs font-semibold uppercase tracking-wider ml-1">
    Password
  </label>

  <div className="relative flex items-center">
    <Lock className="absolute left-4 text-[#8a8d91]" size={18} />

    <input 
      type={showPassword ? "text" : "password"}
      placeholder="Create a password"
      {...register("password")}
      className="w-full bg-[#262a33] border border-[#2d3036] py-3 pl-12 pr-12 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#f7a01b]/[0.02] transition-all text-sm placeholder:text-gray-600"
    />

    <button 
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-4 text-[#8a8d91] hover:text-white transition-colors"
    >
      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
    </button>
  </div>

  {errors.password && (
    <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>
  )}
</div>
            <InputGroup 
              label="Confirm Password"
              type="password"
              error={errors.confirmPassword?.message}
              inputProps={register("confirmPassword")}
              placeholder="Repeat your password"
            />

            <button 
              type="submit" 
              className="w-full bg-[#f7a01b] text-black font-bold py-4 rounded-xl sticky bottom-0 shadow-lg shadow-orange-500/10 hover:opacity-90 active:scale-[0.98] transition-all mt-6"
            >
              Create Account
            </button>

          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <p className="text-[#8a8d91]">
              Already have an account? 
              <Link to="/login" className="text-[#f7a01b] font-semibold hover:underline decoration-2 underline-offset-4 ml-1">Sign In</Link>
            </p>
          </div>
        </div>

        <footer className="mt-8 text-[#8a8d91] text-[10px] uppercase tracking-[2px] opacity-60">
          SMARTBUS TRANSPORTATION SYSTEM © 2026
        </footer>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1c1e26;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f7a01b;
          border-radius: 10px;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

interface InputProps {
  label: string;
  placeholder: string;
  type?: string;
  inputProps: any;
  error?: string;
}

const InputGroup: React.FC<InputProps> = ({ label, placeholder, type = "text", inputProps, error }) => (
  <div className="space-y-1.5">
    <label className="text-[#8a8d91] text-xs font-semibold uppercase tracking-wider ml-1">
      {label}
    </label>

    <input 
      type={type}
      placeholder={placeholder}
      {...inputProps}
      className="w-full bg-[#262a33] border border-[#2d3036] py-3 px-4 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#f7a01b]/[0.02] transition-all text-sm placeholder:text-gray-600" 
    />

    {error && (
      <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>
    )}
  </div>
);

export default SignUp;