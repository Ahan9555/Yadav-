import React, { useState, useRef, useMemo } from 'react';
import { Shield, Image as ImageIcon, Plus, Lock, Search, Grid, FolderHeart, Users, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalleryData } from './hooks/useGalleryData';
import { ViewMode, AuthState, Photo, Tab } from './types';
import { LockScreen } from './components/LockScreen';
import { ImageViewer } from './components/ImageViewer';
import { Button } from './components/ui/Button';

function App() {
  const { 
    photos, 
    people,
    addPhoto, 
    updatePhoto,
    togglePhotoPrivacy, 
    deletePhoto, 
    authState, 
    pin, 
    setupPin, 
    unlockVault, 
    lockVault 
  } = useGalleryData();

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PUBLIC);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PHOTOS);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter photos based on current view mode (Public/Vault)
  const accessiblePhotos = photos.filter(p => 
    viewMode === ViewMode.VAULT ? p.isPrivate : !p.isPrivate
  );

  // --- Filtering Logic ---
  const displayedPhotos = useMemo(() => {
    let filtered = accessiblePhotos;

    // Filter by Search Query (Title)
    if (searchQuery) {
      filtered = filtered.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Filter by Selected Person (Face Grouping)
    if (selectedPersonId) {
      filtered = filtered.filter(p => p.peopleIds?.includes(selectedPersonId));
    }

    return filtered;
  }, [accessiblePhotos, searchQuery, selectedPersonId]);

  // --- Grouping Logic for "Photos" Tab ---
  const groupedPhotos = useMemo(() => {
    const groups: { [key: string]: Photo[] } = {};
    const sorted = [...displayedPhotos].sort((a, b) => b.date - a.date);
    
    sorted.forEach(photo => {
      const date = new Date(photo.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      
      if (date.toDateString() === today.toDateString()) key = "Today";
      else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday";

      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    });
    return groups;
  }, [displayedPhotos]);

  // --- Helpers ---
  const handleVaultAccess = () => {
    if (viewMode === ViewMode.VAULT) {
      setViewMode(ViewMode.PUBLIC);
      lockVault();
      setActiveTab(Tab.PHOTOS); // Reset tab when leaving vault
    } else {
      if (authState === AuthState.UNLOCKED) {
        setViewMode(ViewMode.VAULT);
      } else {
        setShowLockScreen(true);
      }
    }
  };

  const handleUnlock = () => {
    unlockVault();
    setShowLockScreen(false);
    setViewMode(ViewMode.VAULT);
  };

  const handleSetupPin = (newPin: string) => {
    setupPin(newPin);
    setShowLockScreen(false);
    setViewMode(ViewMode.VAULT);
  };

  const getFilterString = (f: any) => {
    if (!f) return 'none';
    return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) sepia(${f.sepia}%) grayscale(${f.grayscale}%)`;
  };

  // --- RENDER VIEWS ---

  // 1. Photo Grid View
  const renderPhotoGrid = () => (
    <div className="space-y-8 pb-24">
       {/* Search Bar for Photos Tab */}
       <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Search photos..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {displayedPhotos.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p>No photos found</p>
        </div>
      )}

      {Object.entries(groupedPhotos).map(([date, groupPhotos]) => (
        <div key={date}>
          <h2 className="text-sm font-semibold text-slate-400 sticky top-20 z-10 bg-slate-950/90 backdrop-blur py-2 mb-3 inline-block px-3 rounded-lg border border-slate-800/50">
            {date}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
            <AnimatePresence mode='popLayout'>
              {(groupPhotos as Photo[]).map((photo) => (
                <motion.div
                  layoutId={`container-${photo.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  key={photo.id}
                  className="group relative aspect-square bg-slate-900 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <motion.img 
                    layoutId={`photo-${photo.id}`}
                    src={photo.url} 
                    alt={photo.title} 
                    style={{ filter: getFilterString(photo.filters) }}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {photo.isPrivate && (
                    <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-lg z-10">
                      <Shield size={10} fill="currentColor" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );

  // 2. Search & People View
  const renderSearchView = () => {
    // If a person is selected, show their photos
    if (selectedPersonId) {
      const person = people.find(p => p.id === selectedPersonId);
      return (
        <div className="pb-24">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setSelectedPersonId(null)}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <img src={person?.faceUrl} alt={person?.name} className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" />
              <h2 className="text-xl font-bold">{person?.name}</h2>
            </div>
          </div>
          {renderPhotoGrid()}
        </div>
      );
    }

    // Default Search/Explore View
    return (
      <div className="pb-24 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Search</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search people, places..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-base text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
            />
          </div>
        </div>

        {/* People Section */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-semibold text-slate-200">People & Pets</h3>
            <button className="text-blue-400 text-sm hover:text-blue-300">View all</button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {people.map(person => {
              const count = accessiblePhotos.filter(p => p.peopleIds?.includes(person.id)).length;
              if (count === 0 && viewMode !== ViewMode.VAULT) return null; // Don't show empty people in public unless configured

              return (
                <button 
                  key={person.id}
                  onClick={() => setSelectedPersonId(person.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-slate-800 group-hover:border-blue-500 transition-colors">
                    <img src={person.faceUrl} alt={person.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">{person.name}</span>
                  <span className="text-xs text-slate-500">{count} photos</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories / Types (Simulated) */}
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Categories</h3>
          <div className="grid grid-cols-2 gap-4">
             {['Screenshots', 'Selfies', 'Videos', 'Favorites'].map((cat, i) => (
               <div key={i} className="bg-slate-800/50 p-4 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/30">
                 <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    {i === 0 ? <ImageIcon size={20} /> : i === 1 ? <Users size={20} /> : <Grid size={20} />}
                 </div>
                 <span className="font-medium text-slate-300">{cat}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    );
  };

  // 3. Albums View
  const renderAlbumsView = () => (
    <div className="pb-24 space-y-6">
      <h2 className="text-2xl font-bold mb-2">Albums</h2>
      
      {/* Create New Album Button */}
      <button className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/30 transition-all">
        <Plus size={20} />
        <span className="font-medium">New Album</span>
      </button>

      {/* Album List */}
      <div className="grid grid-cols-2 gap-4">
        {/* Dynamic All Photos */}
        <div onClick={() => setActiveTab(Tab.PHOTOS)} className="group cursor-pointer">
          <div className="aspect-square bg-slate-800 rounded-2xl overflow-hidden mb-2 relative">
             {accessiblePhotos.length > 0 && (
               <img src={accessiblePhotos[0].url} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt="All" />
             )}
             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
               <span className="font-bold text-white text-lg">Recents</span>
             </div>
          </div>
          <p className="font-medium text-slate-200">Recent Photos</p>
          <p className="text-xs text-slate-500">{accessiblePhotos.length} items</p>
        </div>

        {/* Mock Albums */}
        {[
          { title: 'Camera', count: 124, color: 'bg-emerald-500' },
          { title: 'Instagram', count: 45, color: 'bg-purple-500' },
          { title: 'WhatsApp', count: 320, color: 'bg-green-500' },
          { title: 'Downloads', count: 12, color: 'bg-blue-500' },
        ].map((album, i) => (
          <div key={i} className="group cursor-pointer">
            <div className={`aspect-square ${album.color} bg-opacity-10 rounded-2xl overflow-hidden mb-2 relative flex items-center justify-center border border-slate-800`}>
               <FolderHeart className="text-white/20 w-1/2 h-1/2" />
            </div>
            <p className="font-medium text-slate-200">{album.title}</p>
            <p className="text-xs text-slate-500">{album.count} items</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* --- HEADER --- */}
      <header className={`sticky top-0 z-20 transition-all duration-300 ${viewMode === ViewMode.VAULT ? 'bg-slate-950 border-b border-amber-900/30' : 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50'}`}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {viewMode === ViewMode.VAULT && (
               <Shield size={20} className="text-amber-500" />
            )}
            <h1 className={`text-lg font-bold tracking-tight ${viewMode === ViewMode.VAULT ? 'text-amber-500' : 'text-white'}`}>
              {viewMode === ViewMode.VAULT ? 'Private Vault' : 'VaultGallery'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
             {/* Upload (Hidden in Search/Albums usually, but useful to keep) */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  addPhoto(e.target.files[0]);
                  e.target.value = ''; 
                }
              }}
            />
            
            {activeTab === Tab.PHOTOS && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <Plus size={20} />
              </button>
            )}

            {/* Toggle Vault */}
            <button 
              onClick={handleVaultAccess}
              className={`p-2 rounded-full transition-all duration-300 ${
                viewMode === ViewMode.VAULT 
                  ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {viewMode === ViewMode.VAULT ? <Lock size={20} /> : <Shield size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 max-w-md mx-auto px-4 pt-4 w-full">
        {activeTab === Tab.PHOTOS && renderPhotoGrid()}
        {activeTab === Tab.SEARCH && renderSearchView()}
        {activeTab === Tab.ALBUMS && renderAlbumsView()}
      </main>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/60 pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
          <button 
            onClick={() => { setActiveTab(Tab.PHOTOS); setSelectedPersonId(null); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === Tab.PHOTOS ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {activeTab === Tab.PHOTOS ? <ImageIcon size={24} fill="currentColor" className="opacity-20 stroke-current" strokeWidth={2} /> : <ImageIcon size={24} />}
            <span className="text-[10px] font-medium">Photos</span>
          </button>

          <button 
            onClick={() => setActiveTab(Tab.SEARCH)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === Tab.SEARCH ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Search size={24} strokeWidth={activeTab === Tab.SEARCH ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          <button 
            onClick={() => setActiveTab(Tab.ALBUMS)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === Tab.ALBUMS ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
             {activeTab === Tab.ALBUMS ? <Grid size={24} fill="currentColor" className="opacity-20 stroke-current" strokeWidth={2} /> : <Grid size={24} />}
            <span className="text-[10px] font-medium">Albums</span>
          </button>
        </div>
      </div>

      {/* --- OVERLAYS --- */}
      <AnimatePresence>
        {showLockScreen && (
          <LockScreen 
            authState={authState}
            storedPin={pin}
            onUnlock={handleUnlock}
            onSetPin={handleSetupPin}
            onClose={() => setShowLockScreen(false)}
          />
        )}
        
        {selectedPhoto && (
          <ImageViewer 
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onTogglePrivacy={togglePhotoPrivacy}
            onDelete={deletePhoto}
            onUpdate={updatePhoto}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;