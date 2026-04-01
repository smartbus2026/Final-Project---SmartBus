import React, { useState } from 'react';
import { Bus } from 'lucide-react';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
  };

  return (
    <div className="bg-[#0f1115] text-white min-h-screen flex items-center justify-center p-4 font-sans selection:bg-[#f7a01b] selection:text-black">
      
      <div className="w-full max-w-[440px] flex flex-col items-center">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 bg-[#f7a01b] text-black rounded-[16px] flex items-center justify-center text-xl mb-3 shadow-lg shadow-orange-500/10 transition-transform hover:scale-105">
            <Bus size={28} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SmartBus</h1>
          <p className="text-[#8a8d91] text-xs uppercase tracking-widest mt-1">Student Portal</p>
        </div>

        {/* Form Card */}
        <div className="w-full bg-[#1c1e26] border border-[#2d3036] p-8 md:p-10 rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-xl font-bold mb-1">Create Account</h2>
            <p className="text-[#8a8d91] text-sm">Join our institutional transportation system</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-scroll max-h-[380px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            
            {/* Full Name */}
            <InputGroup 
              label="Full Name" 
              name="fullName"
              type="text" 
              placeholder="Enter your full name" 
              value={formData.fullName}
              onChange={handleChange}
            />

            {/* Email */}
            <InputGroup 
              label="Institutional Email" 
              name="email"
              type="email" 
              placeholder="name@university.edu" 
              value={formData.email}
              onChange={handleChange}
            />

            {/* Password */}
            <InputGroup 
              label="Password" 
              name="password"
              type="password" 
              placeholder="Create a password" 
              value={formData.password}
              onChange={handleChange}
            />

            {/* Confirm Password */}
            <InputGroup 
              label="Confirm Password" 
              name="confirmPassword"
              type="password" 
              placeholder="Repeat your password" 
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-[#f7a01b] text-black font-bold py-4 rounded-xl sticky bottom-0 shadow-lg shadow-orange-500/10 hover:opacity-90 active:scale-[0.98] transition-all mt-6"
            >
              Create Account
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-sm">
            <p className="text-[#8a8d91]">
              Already have an account? 
              <a href="/signin" className="text-[#f7a01b] font-semibold hover:underline decoration-2 underline-offset-4 ml-1">Sign In</a>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <footer className="mt-8 text-[#8a8d91] text-[10px] uppercase tracking-[2px] opacity-60">
          SMARTBUS TRANSPORTATION SYSTEM © 2026
        </footer>
      </div>

      {/* Custom CSS for Scrollbar & Animations */}
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
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputGroup: React.FC<InputProps> = ({ label, name, type, placeholder, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[#8a8d91] text-xs font-semibold uppercase tracking-wider ml-1">
      {label}
    </label>
    <div className="relative flex items-center">
      <input 
        name={name}
        type={type} 
        placeholder={placeholder} 
        value={value}
        onChange={onChange}
        className="w-full bg-[#262a33] border border-[#2d3036] py-3 px-4 rounded-xl text-white outline-none focus:border-[#f7a01b] focus:bg-[#f7a01b]/[0.02] transition-all text-sm placeholder:text-gray-600" 
        required 
      />
    </div>
  </div>
);

export default SignUp;