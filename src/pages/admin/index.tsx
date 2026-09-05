import { useState, useEffect } from 'react';
import AdminLogin from './Login';
import DashboardLayout from './DashboardLayout';
import Students from './Students';
import Events from './Events';
import Settings from './Settings';
import Gallery from './Gallery';
import SampoornaImport from './SampoornaImport';
import HallOfFameAdmin from './HallOfFameAdmin';

export type AdminView = 'students' | 'events' | 'settings' | 'gallery' | 'sampoorna' | 'halloffame';

const AdminWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>('students');

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('adminAuth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setCurrentView('students');
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'students': return <Students />;
      case 'events': return <Events />;
      case 'settings': return <Settings />;
      case 'gallery': return <Gallery />;
      case 'sampoorna': return <SampoornaImport />;
      case 'halloffame': return <HallOfFameAdmin />;
      default: return <Students />;
    }
  };

  return (
    <DashboardLayout 
      currentView={currentView} 
      setCurrentView={setCurrentView} 
      onLogout={handleLogout}
    >
      {renderView()}
    </DashboardLayout>
  );
};

export default AdminWrapper;

