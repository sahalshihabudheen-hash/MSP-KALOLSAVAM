import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Home as HomeIcon, LayoutGrid, Image as ImageIcon, MoreHorizontal, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { subscribeToAuthChanges, logoutStudent, StudentProfile } from '../lib/auth';

const Navbar = () => {
  const [user, setUser] = useState<StudentProfile | null>(null);
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

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

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

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="fixed top-4 right-4 sm:top-6 sm:right-8 z-[100]"
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
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {isMenuOpen
                ? <X size={18} className={textColorClass} />
                : <MoreHorizontal size={20} className={textColorClass} />}
            </motion.div>
          </button>

          {/* Dropdown Glass Card */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 16, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, scale: 0.9, filter: 'blur(5px)', transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`absolute top-full right-0 w-[calc(100vw-2rem)] max-w-72 p-3 rounded-[28px] backdrop-blur-lg border ${buttonBorderClass} ${shadowClass} flex flex-col gap-2 origin-top-right`}
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
                        isActive
                          ? `${activeBgClass} ${activeTextClass}`
                          : `${inactiveTextClass} hover:${textColorClass} ${hoverBgClass}`
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