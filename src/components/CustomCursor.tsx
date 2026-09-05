import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  // Use MotionValue instead of nesting Springs
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Move useSpring hooks ABOVE early return to obey React Hook Rules
  const springX1 = useSpring(mouseX, { damping: 60, stiffness: 50 });
  const springY1 = useSpring(mouseY, { damping: 60, stiffness: 50 });
  
  const springX2 = useSpring(mouseX, { damping: 120, stiffness: 20 });
  const springY2 = useSpring(mouseY, { damping: 120, stiffness: 20 });
  
  const springX3 = useSpring(mouseX, { damping: 150, stiffness: 10 });
  const springY3 = useSpring(mouseY, { damping: 150, stiffness: 10 });

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    if (isDesktop) {
      window.addEventListener('mousemove', moveMouse);
    }

    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('mousemove', moveMouse);
    };
  }, [isDesktop, mouseX, mouseY]);

  if (!isDesktop) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Primary Indigo Orb - Follows mouse closely */}
      <motion.div
        className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full blur-[120px] opacity-[0.15]"
        style={{
          background: 'radial-gradient(circle, rgba(79, 70, 229, 1) 0%, rgba(79, 70, 229, 0) 70%)',
          x: springX1,
          y: springY1,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
      
      {/* Secondary Pink Orb - Drags behind and offset */}
      <motion.div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 1) 0%, rgba(236, 72, 153, 0) 70%)',
          x: springX2,
          y: springY2,
          translateX: '-20%',
          translateY: '-80%',
        }}
      />
      
      {/* Tertiary Cyan Orb - Floats lazily on the opposite side */}
      <motion.div
        className="absolute top-0 left-0 w-[700px] h-[700px] rounded-full blur-[120px] opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 1) 0%, rgba(6, 182, 212, 0) 70%)',
          x: springX3,
          y: springY3,
          translateX: '-80%',
          translateY: '-20%',
        }}
      />
    </div>
  );
};

export default CustomCursor;

