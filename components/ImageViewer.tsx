import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Lock, Unlock, Trash2, Sliders, Check, RotateCcw, 
  Share2, Info, MoreVertical, ChevronLeft, Image as ImageIcon,
  Printer, Monitor, Play
} from 'lucide-react';
import { Photo, PhotoFilters } from '../types';

interface ImageViewerProps {
  photo: Photo;
  onClose: () => void;
  onTogglePrivacy: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Photo>) => void;
}

const DEFAULT_FILTERS: PhotoFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  sepia: 0,
  grayscale: 0,
};

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  photo, 
  onClose, 
  onTogglePrivacy, 
  onDelete,
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [filters, setFilters] = useState<PhotoFilters>(photo.filters || DEFAULT_FILTERS);
  
  // Mock image details for "Info" view
  const imageDetails = {
    resolution: "3024 x 4032",
    size: "3.2 MB",
    camera: "Phone Camera",
    path: photo.isPrivate ? "/Internal Storage/Vault" : "/Internal Storage/DCIM/Camera"
  };

  const getFilterString = (f: PhotoFilters) => {
    return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) sepia(${f.sepia}%) grayscale(${f.grayscale}%)`;
  };

  const handleSave = () => {
    onUpdate(photo.id, { filters });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFilters(photo.filters || DEFAULT_FILTERS);
    setIsEditing(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.title || 'Photo',
          text: 'Check out this photo!',
          url: photo.url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      alert("Sharing is not supported on this device/browser context.");
    }
  };

  const SliderControl = ({ label, value, min, max, onChange }: { label: string, value: number, min: number, max: number, onChange: (val: number) => void }) => (
    <div className="flex flex-col gap-2 w-full px-2">
      <div className="flex justify-between text-xs font-medium text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative w-full h-full flex flex-col overflow-hidden"
      >
        
        {/* --- TOP BAR (Hidden when editing) --- */}
        {!isEditing && (
          <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-6 flex justify-between items-start bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <button 
              onClick={onClose} 
              className="p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={28} />
            </button>

            <div className="flex items-center gap-1">
              {/* Vault Toggle */}
              <button 
                onClick={() => {
                  onTogglePrivacy(photo.id);
                  if (!photo.isPrivate) onClose(); 
                }}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                  photo.isPrivate 
                    ? "text-amber-400 bg-amber-900/20 hover:bg-amber-900/40" 
                    : "text-white hover:bg-white/10"
                }`}
                title={photo.isPrivate ? "Unlock from Vault" : "Move to Vault"}
              >
                {photo.isPrivate ? <Unlock size={22} /> : <Lock size={22} />}
              </button>

              {/* 3-Dot Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                >
                  <MoreVertical size={24} />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute right-0 top-12 z-50 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden py-1"
                      >
                        {[
                          { icon: Play, label: 'Slideshow' },
                          { icon: Monitor, label: 'Set as wallpaper' },
                          { icon: Printer, label: 'Print' },
                        ].map((item, idx) => (
                          <button 
                            key={idx}
                            className="w-full px-4 py-3 flex items-center gap-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors text-left"
                            onClick={() => setShowMenu(false)}
                          >
                            <item.icon size={16} className="text-slate-400" />
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* --- MAIN IMAGE --- */}
        <div 
          className="flex-1 w-full h-full relative" 
          onClick={() => {
            if (!isEditing) {
              // Optional: Toggle bars visibility on tap
            }
          }}
        >
          <motion.img 
            layoutId={`photo-${photo.id}`}
            src={photo.url} 
            alt={photo.title} 
            style={{ filter: getFilterString(filters) }}
            className="w-full h-full object-contain"
          />
        </div>

        {/* --- INFO OVERLAY --- */}
        <AnimatePresence>
          {showInfo && !isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-30 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Details</h3>
                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <ImageIcon size={20} className="text-blue-500 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{photo.title || "IMG_2024.jpg"}</p>
                    <p className="text-xs text-slate-400">{imageDetails.resolution} • {imageDetails.size}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm text-slate-200">
                      {new Date(photo.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Time</p>
                    <p className="text-sm text-slate-200">
                      {new Date(photo.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-slate-500 truncate font-mono bg-black/20 p-2 rounded">
                  {imageDetails.path}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* --- BOTTOM CONTROLS --- */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-6 px-6">
          <AnimatePresence mode='wait'>
            {isEditing ? (
              /* EDIT MODE CONTROLS */
              <motion.div 
                key="edit-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col gap-6 bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800"
              >
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-6 gap-x-4">
                  <SliderControl label="Brightness" value={filters.brightness} min={0} max={200} onChange={(v) => setFilters(f => ({...f, brightness: v}))} />
                  <SliderControl label="Contrast" value={filters.contrast} min={0} max={200} onChange={(v) => setFilters(f => ({...f, contrast: v}))} />
                  <SliderControl label="Saturation" value={filters.saturate} min={0} max={200} onChange={(v) => setFilters(f => ({...f, saturate: v}))} />
                  <SliderControl label="Sepia" value={filters.sepia} min={0} max={100} onChange={(v) => setFilters(f => ({...f, sepia: v}))} />
                  <SliderControl label="Grayscale" value={filters.grayscale} min={0} max={100} onChange={(v) => setFilters(f => ({...f, grayscale: v}))} />
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button 
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                  <div className="flex gap-3">
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">Cancel</button>
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-full shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      <Check size={16} /> Save
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* NORMAL MODE CONTROLS */
              <motion.div 
                key="normal-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex justify-between items-end max-w-md mx-auto"
              >
                {[
                  { icon: Share2, label: 'Share', onClick: handleShare },
                  { icon: Sliders, label: 'Edit', onClick: () => setIsEditing(true) },
                  { icon: Info, label: 'Info', onClick: () => setShowInfo(!showInfo), active: showInfo },
                  { icon: Trash2, label: 'Delete', onClick: () => {
                    if (window.confirm("Delete this photo permanently?")) {
                      onDelete(photo.id);
                      onClose();
                    }
                  }, danger: true },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 group">
                    <button 
                      onClick={item.onClick}
                      className={`p-3.5 rounded-full backdrop-blur-md transition-all duration-200 active:scale-90 shadow-lg ${
                        item.active 
                          ? 'bg-blue-500 text-white shadow-blue-500/30' 
                          : item.danger 
                            ? 'bg-slate-800/80 text-red-400 hover:bg-red-500/20' 
                            : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <item.icon size={22} strokeWidth={2} />
                    </button>
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                      {item.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};