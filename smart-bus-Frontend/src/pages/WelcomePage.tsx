import { Bus, GraduationCap, ShieldCheck, Moon, Sun, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const WelcomePage: React.FC<Props> = ({ theme, toggleTheme }) => {
  

  return (
    <div className="bg-slate-50 dark:bg-[#0f1115] text-gray-800 dark:text-gray-200 font-sans min-h-screen flex flex-col overflow-x-hidden transition-colors duration-300 relative selection:bg-amber-600 selection:text-white">
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-600/30 dark:bg-amber-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-[blob_7s_infinite]"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500/30 dark:bg-yellow-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-[blob_7s_infinite] [animation-delay:2000ms]"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-orange-600/30 dark:bg-orange-800/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-70 animate-[blob_7s_infinite] [animation-delay:4000ms]"></div>
      </div>

      {/* Header / Navbar */}
      <header className="h-20 w-full flex items-center justify-between px-6 sm:px-10 z-20 relative bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-600/20">
            <Bus size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-white font-bold text-xl leading-tight tracking-tight">SmartBus</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
             onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-white/50 dark:bg-[#15181e]/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-600 transition-all shadow-sm"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-12 sm:py-20 w-full max-w-6xl mx-auto">
        
        {/* Hero Text */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600/10 border border-amber-600/20 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
            Welcome to the Future of Commuting
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 tracking-tight">
            Your Daily Commute, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-500">Smarter & Easier.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Track your university bus in real-time, book your trips seamlessly, and never miss a ride again. Choose your portal to get started.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl mx-auto px-4">
          
          {/* Student Card */}
          <PortalCard 
            title="Student Portal"
            description="Book your daily trips, track your assigned bus on the live map, and get instant admin announcements."
            icon={<GraduationCap size={32} />}
            buttonText="Enter as Student"
            link="/signup"
            type="student"
          />

          {/* Admin Card */}
          <PortalCard 
            title="Admin Panel"
            description="Manage users, monitor live bus routes, track occupancy rates, and handle support tickets efficiently."
            icon={<ShieldCheck size={32} />}
            buttonText="Enter as Admin"
            link="/admin/login"
            type="admin"
          />

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-gray-500 dark:text-gray-500">
        &copy; 2026 SmartBus System. All rights reserved.
      </footer>

      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// Sub-component for Cards
interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  link: string;
  type: 'student' | 'admin';
}

const PortalCard: React.FC<CardProps> = ({ title, description, icon, buttonText, link, type }) => {
  const isStudent = type === 'student';
  
  return (
    <Link to={link} className={`group relative bg-white/80 dark:bg-[#15181e]/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:border-amber-600/50 dark:hover:border-amber-600/50 rounded-3xl p-8 sm:p-10 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-600/10 animate-[float_6s_ease-in-out_infinite] ${!isStudent && '[animation-delay:3s]'} hover:-translate-y-2 flex flex-col items-center text-center`}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-sm
        ${isStudent 
          ? 'bg-orange-50 dark:bg-amber-600/10 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:bg-gray-800 dark:group-hover:bg-gray-700 group-hover:text-white'
        } group-hover:scale-110`}>
        {icon}
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8 flex-1">
        {description}
      </p>
      
      <div className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors duration-300 flex items-center justify-center gap-2
        ${isStudent 
          ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white group-hover:bg-amber-600 group-hover:text-white' 
          : 'bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white group-hover:bg-gray-800 dark:group-hover:bg-gray-700 group-hover:text-white'
        }`}>
        {buttonText} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
};

export default WelcomePage;