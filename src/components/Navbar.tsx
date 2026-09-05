import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Home as HomeIcon, LayoutGrid, Image as ImageIcon, MoreHorizontal, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { subscribeToAuthChanges, logoutStudent } from '../lib/auth';

const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutStudent();
    navigate('/');
  };

  const links = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Items', path: '/items', icon: LayoutGrid },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon },
  ];

  const isLightBg = location.pathname === '/student-auth' || location.pathname === '/register';
  const textColorClass = isLightBg ? 'text-slate-800' : 'text-white';
  const inactiveTextClass = isLightBg ? 'text-slate-500' : 'text-white/70';
  const hoverBgClass = isLightBg ? 'hover:bg-slate-100/80' : 'hover:bg-white/5';
  const dividerClass = isLightBg ? 'bg-slate-200' : 'bg-white/10';
  const activeTextClass = isLightBg ? 'text-brand-primary' : 'text-brand-accent';
  const activeBgClass = isLightBg ? 'bg-sky-50' : 'bg-brand-accent/10';
  const buttonBorderClass = isLightBg ? 'border-slate-200/80' : 'border-white/10';
  const hoverButtonBgClass = isLightBg ? 'hover:bg-slate-100' : 'hover:bg-white/10';
  const shadowClass = isLightBg ? 'shadow-[0_20px_40px_rgba(15,23,42,0.06)]' : 'shadow-[0_20px_40px_rgba(0,0,0,0.4)]';
  const iconShadowClass = isLightBg ? 'shadow-sm' : 'shadow-[0_8px_30px_rgba(0,0,0,0.3)]';
  const glassBgClass = isLightBg ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255,255,255,0.05)';

  // Don't show public navbar on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Mobile: Ultra-Slim Beautiful Floating Pill Navigation - Always visible & anchored */}
      <nav
        className="md:hidden mobile-floating-dock fixed bottom-4 inset-x-0 mx-auto z-[9999] rounded-full flex items-center justify-around pointer-events-auto"
        style={{
          position: 'fixed',
          bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
          zIndex: 9999,
          width: 'calc(100% - 2rem)',
          maxWidth: '350px',
          height: '48px',
          background: 'rgba(8, 14, 28, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        <div className="flex items-center justify-around w-full px-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path}
                className={`relative flex items-center justify-center gap-1.5 py-1 px-3 rounded-full transition-all duration-200 active:scale-90 ${
                  isActive 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]' 
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.4 : 1.7} />
                <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-sky-400 font-bold' : 'text-white/60'}`}>
                  {link.name}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                )}
              </Link>
            );
          })}
          
          <div className="flex items-center justify-center">
            {user ? (
              <Link 
                to="/dashboard" 
                className={`relative flex items-center justify-center gap-1.5 py-1 px-3 rounded-full transition-all duration-200 active:scale-90 ${
                  location.pathname === '/dashboard' 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]' 
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  location.pathname === '/dashboard' ? 'border-sky-400' : 'border-white/40'
                }`}>
                  <User size={10} strokeWidth={2} />
                </div>
                <span className={`text-[10px] font-semibold tracking-tight ${
                  location.pathname === '/dashboard' ? 'text-sky-400 font-bold' : 'text-white/60'
                }`}>Profile</span>
                {location.pathname === '/dashboard' && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                )}
              </Link>
            ) : (
              <Link 
                to="/student-auth" 
                className={`relative flex items-center justify-center gap-1.5 py-1 px-3 rounded-full transition-all duration-200 active:scale-90 ${
                  location.pathname === '/student-auth' 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]' 
                    : 'text-white/50 hover:text-sky-300'
                }`}
              >
                <User size={16} strokeWidth={location.pathname === '/student-auth' ? 2.4 : 1.7} />
                <span className={`text-[10px] font-semibold tracking-tight ${
                  location.pathname === '/student-auth' ? 'text-sky-400 font-bold' : 'text-white/60'
                }`}>Login</span>
                {location.pathname === '/student-auth' && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                )}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop: Minimal floating dot button with dropdown */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden md:block fixed top-6 right-8 z-[999]"
      >
        <div className="relative flex flex-col items-end">
          {/* Main Round Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-10 h-10 rounded-full backdrop-blur-md border ${buttonBorderClass} ${iconShadowClass} flex items-center justify-center ${hoverButtonBgClass} hover:scale-110 active:scale-90 transition-all duration-300`}
            style={{ background: glassBgClass }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isMenuOpen ? <X size={18} className={textColorClass} /> : <MoreHorizontal size={20} className={textColorClass} />}
            </motion.div>
          </button>

          {/* Dropdown Glass Card */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 16, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, scale: 0.9, filter: "blur(5px)", transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`absolute top-full right-0 w-72 p-3 rounded-[28px] backdrop-blur-lg border ${buttonBorderClass} ${shadowClass} flex flex-col gap-2 origin-top-right`}
                style={{ background: glassBgClass }}
              >
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                        isActive ? `${activeBgClass} ${activeTextClass}` : `${inactiveTextClass} hover:${textColorClass} ${hoverBgClass}`
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-bold text-sm">{link.name}</span>
                    </Link>
                  );
                })}

                <div className={`h-[1px] ${dividerClass} my-1 mx-2`}></div>

                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-2xl ${inactiveTextClass} hover:${textColorClass} ${hoverBgClass} transition-all`}
                    >
                      <User size={20} />
                      <span className="font-bold text-sm">Dashboard</span>
                    </Link>
                    <button 
                      onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all text-left w-full"
                    >
                      <LogOut size={20} />
                      <span className="font-bold text-sm">Logout</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/student-auth" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 mt-1 mx-2 mb-1 px-4 py-3 rounded-xl font-black text-sm uppercase tracking-wider text-white transition-all hover:scale-[1.02] shadow-lg shadow-brand-accent/20"
                    style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)' }}
                  >
                    <User size={18} /> Login / Register
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
