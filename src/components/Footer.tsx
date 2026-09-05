const Footer = () => {
  return (
    <footer className="mt-auto relative z-10 pt-12 pb-6 px-4 md:px-8 w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center w-full border-t border-slate-200/60 md:border-white/20 pt-6 gap-4">
        
        {/* Copyright */}
        <p className="text-slate-500 dark:text-slate-400 md:text-slate-600 dark:text-slate-300 font-mono text-xs md:text-sm">
          &copy; {new Date().getFullYear()} MSP HSS Malappuram
        </p>
        
        {/* Sleek Glowing Cyberpunk Style Watermark - Small version */}
        <div className="flex flex-col items-center md:items-end gap-1 group cursor-default mt-4 md:mt-0 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="w-4 h-[1px] bg-slate-200 group-hover:w-6 group-hover:bg-brand-primary/40 transition-all duration-500"></span>
            <span className="text-[8px] md:text-[9px] uppercase text-slate-400 tracking-[0.2em] font-bold">Created By</span>
            <span className="font-black text-xs md:text-sm tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary bg-[length:200%_auto] animate-gradient relative drop-shadow-[0_0_8px_rgba(14,165,233,0.2)] group-hover:drop-shadow-[0_0_12px_rgba(14,165,233,0.4)] transition-all duration-300">
              VYSHNAV
            </span>
            <span className="text-[8px] md:text-[9px] font-mono font-bold text-brand-accent uppercase tracking-[0.2em] ml-1">
              (BATCH '25-26)
            </span>
          </div>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;

