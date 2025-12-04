export interface PhotoFilters {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  grayscale: number;
}

export interface Person {
  id: string;
  name: string;
  faceUrl: string; // URL to a cropped image of the face
}

export interface Photo {
  id: string;
  url: string;
  isPrivate: boolean;
  date: number;
  title?: string;
  filters?: PhotoFilters;
  peopleIds?: string[]; // IDs of people detected in this photo
}

export enum ViewMode {
  PUBLIC = 'PUBLIC',
  VAULT = 'VAULT'
}

export enum AuthState {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  SETUP = 'SETUP'
}

export enum Tab {
  PHOTOS = 'PHOTOS',
  SEARCH = 'SEARCH',
  ALBUMS = 'ALBUMS'
}