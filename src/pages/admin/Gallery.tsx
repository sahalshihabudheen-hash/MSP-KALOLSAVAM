import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { getGallery, addGalleryImage, createGalleryAlbum, deleteGalleryImage, deleteGalleryAlbum } from '../../lib/db';
import type { GalleryAlbum } from '../../lib/db';

const Gallery = () => {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    const data = await getGallery();
    setAlbums(data);
    if (data.length > 0 && !selectedAlbumId) {
      setSelectedAlbumId(data[0].id);
    } else if (data.length === 0) {
      setSelectedAlbumId('');
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newAlbumTitle.trim();
    if (!title) return;
    
    // Optimistic UI Update
    setNewAlbumTitle('');
    const tempId = 'temp-' + Date.now();
    const optimisticAlbum: GalleryAlbum = { id: tempId, title, images: [] };
    setAlbums(prev => [optimisticAlbum, ...prev]);
    if (!selectedAlbumId) setSelectedAlbumId(tempId);

    try {
      await createGalleryAlbum(title);
      // Refresh to get real DB IDs
      loadAlbums();
    } catch (err) {
      console.error("Failed to create album:", err);
      // Revert on failure
      loadAlbums();
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (confirm('Are you sure you want to delete this entire album and all its images?')) {
      await deleteGalleryAlbum(id);
      if (selectedAlbumId === id) setSelectedAlbumId('');
      loadAlbums();
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const processFile = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Not an image file.'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1920; // High definition, but guaranteed < 1MB
            const MAX_HEIGHT = 1920;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            // Compress to 80% JPEG quality (usually 300KB - 800KB)
            canvas.toBlob(async (blob) => {
              if (!blob) {
                reject(new Error("Canvas to Blob failed"));
                return;
              }
              
              const formData = new FormData();
              // Give it a proper name
              formData.append('image', blob, file.name.replace(/\.[^/.]+$/, "") + ".jpg");

              try {
                // Upload to local server to avoid Firebase Array limits
                const res = await fetch('/api/upload', {
                  method: 'POST',
                  body: formData
                });

                if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(`Server returned ${res.status}: ${errText.substring(0, 50)}`);
                }

                const data = await res.json();
                
                // Save the local disk URL to Firebase (tiny 40 byte string)
                await addGalleryImage(selectedAlbumId, data.url);
                resolve();
              } catch (uploadError: any) {
                console.error("Upload error:", uploadError);
                reject(new Error(uploadError.message || 'Unknown upload error'));
              }
            }, 'image/jpeg', 0.8);
            
          } catch (error: any) {
            console.error("Storage error:", error);
            reject(new Error(error.message || 'Unknown processing error'));
          }
        };
        img.onerror = () => {
          reject(new Error('Browser could not read this image type. Please upload a standard JPG or PNG.'));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!selectedAlbumId || files.length === 0) return;
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;
    let lastError = "";
    
    for (let i = 0; i < files.length; i++) {
      try {
        await processFile(files[i]);
        successCount++;
      } catch (err: any) {
        console.error(err);
        failCount++;
        lastError = err.message || "Unknown error";
      }
    }
    
    setIsUploading(false);
    loadAlbums();
    
    if (failCount > 0) {
      alert(`Uploaded ${successCount} images. Failed ${failCount}. Reason: ${lastError}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const selectedAlbum = albums.find(a => a.id === selectedAlbumId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Gallery Management</h1>
        <p className="text-text-muted mt-1">Organize images into albums (e.g. Kalolsavam 2026)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Albums */}
        <div className="lg:col-span-1 cin-card border-none/95 md:bg-transparent md:border-none md:shadow-none md:admin-glass-panel rounded-2xl md:rounded-[30px] shadow-sm border border-white/10 p-4 md:p-6">
          <h2 className="font-bold text-brand-primary mb-4 pb-2 border-b border-slate-100 md:border-white/30 flex items-center gap-2">
            Albums
          </h2>
          
          <form onSubmit={handleCreateAlbum} className="mb-4 flex gap-2">
            <input 
              type="text" 
              placeholder="New album name..."
              value={newAlbumTitle}
              onChange={e => setNewAlbumTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-brand-primary focus:bg-white/10 focus:outline-none transition-colors"
            />
            <button type="submit" className="p-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/80 transition-colors">
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-2">
            {albums.length === 0 ? (
              <p className="text-xs text-white/50 text-center py-4">No albums created yet.</p>
            ) : (
              albums.map(album => (
                <div 
                  key={album.id}
                  onClick={() => setSelectedAlbumId(album.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors border ${
                    selectedAlbumId === album.id 
                      ? 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary font-bold' 
                      : 'bg-transparent border-transparent text-white/60 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate text-sm flex-1">{album.title} ({album.images.length})</div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Area: Upload & View */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedAlbumId ? (
            <div className="bg-transparent border-2 border-dashed border-white/10 rounded-3xl p-12 text-center">
              <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-white/50 font-medium">Select or create an album to upload images.</p>
            </div>
          ) : (
            <>
              {/* Upload Zone */}
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                className={`w-full p-6 md:p-8 border-2 border-dashed rounded-2xl md:rounded-[30px] flex flex-col items-center justify-center transition-all cin-card border-none/95 md:bg-transparent md:admin-glass-panel md:border-white/40
                  ${isDragging ? 'border-brand-accent bg-brand-accent/5 scale-[1.01]' : 'border-slate-300 hover:border-brand-primary hover:cin-card border-none/30'}
                `}
              >
                <div className="flex flex-col items-center">
                  <Upload size={32} className={`mb-4 ${isDragging ? 'text-brand-accent' : 'text-slate-400'}`} />
                  <p className="font-bold text-white/80 mb-2 text-center">Drag & Drop to upload into "{selectedAlbum?.title}"</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden" 
                    accept="image/*"
                    multiple
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-6 py-2 mt-2 bg-brand-accent text-white hover:bg-brand-accent/80 rounded-full font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Browse Files'
                    )}
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div>
                <h3 className="text-lg font-bold text-brand-primary mb-4">{selectedAlbum?.title} Images</h3>
                {selectedAlbum?.images.length === 0 ? (
                  <p className="text-white/50 text-sm">No images in this album.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {selectedAlbum?.images.map((img, idx) => (
                      <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-white/10 shadow-sm">
                        <img src={img.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={async () => {
                              await deleteGalleryImage(selectedAlbum.id, img.id);
                              loadAlbums();
                            }}
                            className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;

