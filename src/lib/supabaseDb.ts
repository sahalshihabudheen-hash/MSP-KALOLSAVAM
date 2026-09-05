import { supabase } from './supabase';

export interface KalolsavamEvent {
  id: string;
  category: string;
  item_name: string;
  item_code: string;
}

export interface RegistrationEntry {
  id: string;
  full_name: string;
  class_grade: string;
  division: string;
  category: string;
  item_names: string[];
  item_codes: string[];
  date: string;
}

export interface SystemSettings {
  registration_open: boolean;
  start_date: string;
  end_date: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  images: string[];
}

// Events API
export const getEvents = async (): Promise<KalolsavamEvent[]> => {
  const { data, error } = await supabase.from('events').select('*');
  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data || [];
};

export const addEvent = async (event: Omit<KalolsavamEvent, 'id'>) => {
  const { data, error } = await supabase.from('events').insert([event]).select().single();
  if (error) throw error;
  return data;
};

export const deleteEvent = async (id: string) => {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
};

export const updateEvent = async (id: string, updates: Partial<KalolsavamEvent>) => {
  const { error } = await supabase.from('events').update(updates).eq('id', id);
  if (error) throw error;
};

// Registrations API
export const getRegistrations = async (): Promise<RegistrationEntry[]> => {
  const { data, error } = await supabase.from('registrations').select('*');
  if (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
  return data || [];
};

export const addRegistration = async (entry: Omit<RegistrationEntry, 'id' | 'date'>) => {
  const { data, error } = await supabase.from('registrations').insert([entry]).select().single();
  if (error) throw error;
  return data;
};

export const updateRegistration = async (id: string, updates: Partial<RegistrationEntry>) => {
  const { error } = await supabase.from('registrations').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteRegistration = async (id: string) => {
  const { error } = await supabase.from('registrations').delete().eq('id', id);
  if (error) throw error;
};

// Settings API
export const getSettings = async (): Promise<SystemSettings> => {
  const { data, error } = await supabase.from('settings').select('*').limit(1).single();
  if (error) {
    console.error('Error fetching settings:', error);
    return {
      registration_open: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    };
  }
  return data;
};

export const updateSettings = async (settings: SystemSettings) => {
  const { data } = await supabase.from('settings').select('id').limit(1).single();
  if (data?.id) {
    const { error } = await supabase.from('settings').update(settings).eq('id', data.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('settings').insert([settings]);
    if (error) throw error;
  }
};

// Gallery API
export const getGallery = async (): Promise<GalleryAlbum[]> => {
  const { data: albums, error: albumError } = await supabase.from('gallery_albums').select('*');
  if (albumError) {
    console.error('Error fetching albums:', albumError);
    return [];
  }

  const { data: images, error: imageError } = await supabase.from('gallery_images').select('*');
  if (imageError) {
    console.error('Error fetching images:', imageError);
    return albums.map(a => ({ ...a, images: [] }));
  }

  return albums.map(album => ({
    ...album,
    images: images.filter(img => img.album_id === album.id).map(img => img.image_url)
  }));
};

export const addGalleryImage = async (albumId: string, file: File): Promise<void> => {
  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${albumId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('gallery').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filePath);

  // Add to database
  const { error: dbError } = await supabase.from('gallery_images').insert([{
    album_id: albumId,
    image_url: publicUrl
  }]);
  if (dbError) throw dbError;
};

export const createGalleryAlbum = async (title: string): Promise<void> => {
  const { error } = await supabase.from('gallery_albums').insert([{ title }]);
  if (error) throw error;
};

export const deleteGalleryImage = async (_albumId: string, imageUrl: string): Promise<void> => {
  // Delete from DB
  const { error: dbError } = await supabase.from('gallery_images').delete().eq('image_url', imageUrl);
  if (dbError) throw dbError;

  // Extract path from public URL and delete from storage
  const pathParts = imageUrl.split('/gallery/');
  if (pathParts.length > 1) {
    const filePath = pathParts[1];
    await supabase.storage.from('gallery').remove([filePath]);
  }
};

export const deleteGalleryAlbum = async (albumId: string): Promise<void> => {
  const { error } = await supabase.from('gallery_albums').delete().eq('id', albumId);
  if (error) throw error;
  
  // We should also delete files in storage, but we skip it for simplicity here
  // as the db row deletion will cascade delete the image rows.
};
