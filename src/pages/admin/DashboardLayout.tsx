import { Users, CalendarDays, Settings, Image as ImageIcon, LogOut, Database, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AdminView } from './index';

const NAV_ITEMS: { id: AdminView, label: string, icon: any }[] = [
  { id: 'students', label: 'Students', icon: Users },
  { id: 'events', label: 'Items', icon: CalendarDays },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'sampoorna', label: 'Sampoorna DB', icon: Database },
  { id: 'halloffame', label: 'Hall of Fame', icon: Crown },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const DashboardLayout = ({ 
  currentView, 
  setCurrentView, 
  onLogout, 
  children 
}: { 
  currentView: AdminView, 
  setCurrentView: (v: AdminView) => void, 
  onLogout: () => void, 
  children: React.ReactNode 
}) => {

  const SidebarContent = () => (
    <>
      <div className="p-6 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-brand-accent/20 border border-brand-accent/50 rounded-xl flex items-center justify-center shadow-lg text-brand-accent font-bold text-xl">
          M
        </div>
        <div>
          <h2 className="font-bold text-white leading-tight">Admin Panel</h2>
          <p className="text-xs text-white/50 font-medium">Kalolsavam 2026</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <button 
              key={item.id} 
              onClick={() => {
                setCurrentView(item.id);
              }}
              className={`flex items-center w-full text-left gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive 
                  ? 'bg-brand-accent/20 text-brand-accent shadow-md border border-brand-accent/30' 
                  : 'text-white/60 hover:cin-card border-none/5 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-brand-accent' : 'text-white/40'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-400 font-medium hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-transparent flex z-[100] relative">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 cin-card fixed h-[calc(100vh-2rem)] z-20 m-4 rounded-[30px] overflow-hidden shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile App-like Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-xl border-b border-white/10 z-30 flex items-center justify-between px-4 shadow-sm" style={{ background: 'rgba(7,16,31,0.85)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-accent/20 border border-brand-accent/50 rounded-lg flex items-center justify-center shadow-md text-brand-accent font-bold text-sm">
            M
          </div>
          <h2 className="font-bold text-white">Admin Panel</h2>
        </div>
        <button onClick={onLogout} className="p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 mt-16 md:mt-0 mb-24 md:mb-0 px-2 py-4 md:p-8 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t border-white/10 z-40 pb-safe shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.5)]" style={{ background: 'rgba(7,16,31,0.9)' }}>
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-brand-accent' : 'text-white/40 hover:text-white'
                }`}
              >
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`${isActive ? 'bg-brand-accent/20 p-1.5 rounded-xl text-brand-accent' : 'p-1.5'}`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;

