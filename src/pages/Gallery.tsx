import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Search, Download, X, Camera } from 'lucide-react';
import { getGallery } from '../lib/db';
import type { GalleryAlbum } from '../lib/db';

const Gallery = () => {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getGallery().then(data => {
      setAlbums(data);
      setIsLoading(false);
    });
  }, []);

  const handleDownload = async (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const filteredAlbums = albums.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cycle gradient accent colours per album index (same as Items page palette)
  const ALBUM_GRADIENTS = [
    'from-sky-400 to-indigo-500',
    'from-violet-400 to-purple-500',
    'from-emerald-400 to-teal-500',
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-500',
  ];

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 md:px-8 bg-transparent">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold tracking-[0.3em] uppercase text-brand-accent mb-3"
          >
            ✦ Festival Memories ✦
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none"
          >
            Photo <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Gallery</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base text-white/50 max-w-xl mx-auto"
          >
            Memories from the Kalolsavam arts festival.
          </motion.p>
        </div>

        {/* Filter / Search bar — same style as Items page */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-end mb-10"
        >
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search albums..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 rounded-full focus:outline-none focus:bg-white/10 transition-all text-sm font-medium text-white placeholder-white/30"
            />
          </div>
        </motion.div>

        {/* Album Cards Grid — same style as Items page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          <AnimatePresence>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={`sk-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-36 rounded-2xl animate-pulse border border-white/8"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
              ))
            ) : filteredAlbums.length === 0 ? (
              <div className="col-span-full text-center py-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ duration: 0.5, type: "spring" }}
                  className="relative z-10"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <ImageIcon size={40} className="text-brand-accent/80 drop-shadow-[0_0_15px_rgba(var(--brand-accent),0.5)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Albums Yet</h3>
                  <p className="text-white/50 max-w-sm mx-auto">Check back soon for beautiful memories and photos from the Kalolsavam festival.</p>
                </motion.div>
              </div>
            ) : (
              filteredAlbums.map((album, idx) => {
                const gradient = ALBUM_GRADIENTS[idx % ALBUM_GRADIENTS.length];
                const cover = album.images?.[0]?.url;
                const isOpen = openAlbumId === album.id;
                return (
                  <motion.div
                    key={album.id}
                    layout
                    initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '-5%' }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, delay: Math.min(idx * 0.06, 0.4), ease: [0.16, 1, 0.3, 1] }}
                    className={`group relative rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer
                      ${isOpen
                        ? 'col-span-full shadow-xl shadow-black/20'
                        : 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40'
                      }`}
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
                    onClick={() => setOpenAlbumId(isOpen ? null : album.id)}
                  >
                    {/* Removed buggy top bar */}

                    {/* Collapsed: card view */}
                    {!isOpen && (
                      <div className="p-5">
                        {/* Cover thumbnail */}
                        {cover && (
                          <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 bg-white/5">
                            <img src={cover} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        )}
                        {!cover && (
                          <div className="w-full aspect-video rounded-xl mb-4 flex items-center justify-center border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <ImageIcon size={32} className="text-white/20" />
                          </div>
                        )}

                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-bold text-white/90 leading-snug group-hover:text-white transition-colors duration-200 flex-1 mr-2">
                            {album.title}
                          </h3>
                          <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black rounded-lg text-white bg-gradient-to-r ${gradient} shadow-md`}>
                            <span>{album.images?.length || 0}</span>
                            <Camera size={12} className="opacity-90" />
                          </span>
                        </div>
                        <p className="text-xs text-white/30 mt-1">Tap to view photos</p>
                      </div>
                    )}

                    {/* Expanded: full image grid */}
                    {isOpen && (
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-black rounded-lg text-white bg-gradient-to-r ${gradient}`}>
                              Album
                            </span>
                            <h2 className="text-xl font-bold text-white">{album.title}</h2>
                            <span className="text-sm text-white/40">{album.images?.length || 0} images</span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setOpenAlbumId(null); }}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {(!album.images || album.images.length === 0) ? (
                          <p className="text-white/40 italic text-center py-8">No images in this album yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {album.images.map((img, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={e => { e.stopPropagation(); setSelectedImage(img.url); }}
                                className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 relative group/img hover:border-white/25 transition-all"
                              >
                                <img src={img.url} alt="" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    onClick={e => handleDownload(img.url, e)}
                                    className="p-2 rounded-full bg-brand-accent text-white hover:scale-110 transition-transform"
                                  >
                                    <Download size={14} />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage}
              alt="Fullscreen"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute top-6 right-6 flex items-center gap-3">
              <button
                onClick={e => handleDownload(selectedImage, e)}
                className="text-white/70 hover:text-white bg-black/40 hover:bg-brand-accent p-3 rounded-full backdrop-blur-md transition-all shadow-lg"
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-white/70 hover:text-white bg-black/40 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-all shadow-lg"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
