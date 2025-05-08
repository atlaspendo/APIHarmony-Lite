
import type { OpenAPI } from 'openapi-types';
import { create } from 'zustand';
import type { OpenApiSpec as PrismaOpenApiSpec } from '@prisma/client';

export interface OpenApiState {
  spec: OpenAPI.Document | null; // Parsed spec object
  fileName: string | null; // Original file name or derived name
  rawSpec: string | null; // Raw spec string (YAML or JSON)
  activeSpecId: string | null; // ID from the database if loaded from there
  error: string | null;
  isLoading: boolean;
  setSpec: (
    specData: {
      specObject: OpenAPI.Document;
      rawSpecText: string;
      name: string;
      id?: string; // Optional: ID if it's from DB
    }
  ) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void; // Clears the active spec
}

export const useOpenApiStore = create<OpenApiState>((set) => ({
  spec: null,
  fileName: null,
  rawSpec: null,
  activeSpecId: null,
  error: null,
  isLoading: false,
  setSpec: (specData) => {
    set({
      spec: specData.specObject,
      rawSpec: specData.rawSpecText,
      fileName: specData.name,
      activeSpecId: specData.id || null, // Store ID if available
      error: null,
      isLoading: false,
    });
  },
  setError: (error) => set({
    error,
    spec: null,
    rawSpec: null,
    fileName: null,
    activeSpecId: null,
    isLoading: false,
  }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({
    spec: null,
    rawSpec: null,
    fileName: null,
    activeSpecId: null,
    error: null,
    isLoading: false,
  }),
}));
