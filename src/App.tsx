import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import LiquidBackground from './components/LiquidBackground';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import Registration from './pages/Registration';
import StudentAuth from './pages/StudentAuth';
import StudentDashboard from './pages/StudentDashboard';
import PublicGallery from './pages/Gallery';
import Items from './pages/Items';

// Admin Imports
import AdminWrapper from './pages/admin/index';
import { IntroContext } from './context/IntroContext';

// Smooth Scroll Wrapper
const SmoothScroll = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only initialize Lenis on non-touch desktop devices
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    // @ts-ignore
    window.lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      // @ts-ignore
      delete window.lenis;
    };
  }, []);

  // Scroll to top on route change using Lenis
  useEffect(() => {
    // @ts-ignore
    if (window.lenis) {
      // @ts-ignore
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return <>{children}</>;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <IntroContext.Provider value={{ introComplete: !isLoading }}>
      <LayoutGroup id="hero-intro">
        <Router>
          <AnimatePresence>
            {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
          </AnimatePresence>
          <LiquidBackground />
          <Navbar />
          <SmoothScroll>
            <CustomCursor />
            <Routes>
              {/* Public Routes with Footer */}
              <Route path="/" element={
                <div className="flex flex-col min-h-screen pb-24 md:pb-0">
                  <div className="flex-grow">
                    <AnimatePresence mode="wait">
                      <Home />
                    </AnimatePresence>
                  </div>
                </div>
              } />
              <Route path="/items" element={
                <div className="flex flex-col min-h-screen pb-24 md:pb-0">
                  <div className="flex-grow">
                    <AnimatePresence mode="wait">
                      <Items />
                    </AnimatePresence>
                  </div>
                  <Footer />
                </div>
              } />
              <Route path="/student-auth" element={
                <div className="flex flex-col min-h-screen pb-24 md:pb-0">
                  <div className="flex-grow">
                    <AnimatePresence mode="wait">
                      <StudentAuth />
                    </AnimatePresence>
                  </div>
                </div>
              } />
              <Route path="/register" element={
                <div className="flex flex-col min-h-screen pb-24 md:pb-0">
                  <div className="flex-grow">
                    <AnimatePresence mode="wait">
                      <Registration />
                    </AnimatePresence>
                  </div>
                  <Footer />
                </div>
              } />
              <Route path="/dashboard" element={
                <div className="flex flex-col min-h-screen pb-24 md:pb-0">
                  <div className="flex-grow">
                    <AnimatePresence mode="wait">
                      <StudentDashboard />
                    </AnimatePresence>
                  </div>
                  <Footer />
                </div>
              } />
              <Route path="/gallery" element={
                <div className="flex flex-col min-h-screen pb-24 md:pb-0">
                  <div className="flex-grow">
                    <AnimatePresence mode="wait">
                      <PublicGallery />
                    </AnimatePresence>
                  </div>
                  <Footer />
                </div>
              } />

              {/* Admin Routes (No public Footer or Navbar) */}
              <Route path="/admin/*" element={<AdminWrapper />} />
            </Routes>
          </SmoothScroll>
        </Router>
      </LayoutGroup>
    </IntroContext.Provider>
  );
}

export default App;

