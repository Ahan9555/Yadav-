import { useState, useEffect } from 'react';
import { Photo, AuthState, Person } from '../types';

// Mock People Data (Simulating known faces)
const MOCK_PEOPLE: Person[] = [
  { id: 'p1', name: 'Me', faceUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces' },
  { id: 'p2', name: 'Sarah', faceUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces' },
  { id: 'p3', name: 'David', faceUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=faces' },
  { id: 'p4', name: 'Emma', faceUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces' },
];

const INITIAL_PHOTOS: Photo[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800', isPrivate: false, date: Date.now(), title: 'Profile Shot', peopleIds: ['p1'] },
  { id: '2', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800', isPrivate: false, date: Date.now() - 86400000, title: 'Group Selfie', peopleIds: ['p2', 'p4'] },
  { id: '3', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=800', isPrivate: true, date: Date.now() - 100000000, title: 'Secret Doc', peopleIds: ['p3'] }, 
  { id: '4', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800', isPrivate: false, date: Date.now() - 172800000, title: 'Summer Vibe', peopleIds: ['p4'] },
  { id: '5', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800', isPrivate: false, date: Date.now(), title: 'Sarah Portrait', peopleIds: ['p2'] },
  { id: '6', url: 'https://picsum.photos/400/600?random=1', isPrivate: false, date: Date.now(), title: 'Mountain View', peopleIds: [] },
];

export const useGalleryData = () => {
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [people] = useState<Person[]>(MOCK_PEOPLE);
  const [pin, setPin] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOCKED);

  // Load PIN from local storage on mount
  useEffect(() => {
    const savedPin = localStorage.getItem('vault_pin');
    if (savedPin) {
      setPin(savedPin);
    } else {
      setAuthState(AuthState.SETUP);
    }
  }, []);

  const addPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        // SIMULATE AI FACE DETECTION
        // Randomly assign 0 to 2 people to the new photo
        const shuffledPeople = [...MOCK_PEOPLE].sort(() => 0.5 - Math.random());
        const detectedPeople = shuffledPeople.slice(0, Math.floor(Math.random() * 3)).map(p => p.id);

        const newPhoto: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          url: e.target.result as string,
          isPrivate: false,
          date: Date.now(),
          title: file.name,
          peopleIds: detectedPeople
        };
        setPhotos(prev => [newPhoto, ...prev]);
      }
    };
    reader.readAsDataURL(file);
  };

  const updatePhoto = (id: string, updates: Partial<Photo>) => {
    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const togglePhotoPrivacy = (id: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, isPrivate: !p.isPrivate } : p
    ));
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const setupPin = (newPin: string) => {
    setPin(newPin);
    localStorage.setItem('vault_pin', newPin);
    setAuthState(AuthState.UNLOCKED);
  };

  const unlockVault = () => {
    setAuthState(AuthState.UNLOCKED);
  };

  const lockVault = () => {
    setAuthState(AuthState.LOCKED);
  };

  return {
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
  };
};