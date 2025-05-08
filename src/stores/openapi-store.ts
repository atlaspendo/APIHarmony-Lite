
import type { OpenAPI } from 'openapi-types';
import { create } from 'zustand';

export interface OpenApiState {
  spec: OpenAPI.Document | null;
  fileName: string | null;
  rawSpec: string | null; // Store the raw spec string for the AI and display
  error: string | null;
  isLoading: boolean;
  setSpec: (spec: OpenAPI.Document, rawSpec: string, fileName: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useOpenApiStore = create<OpenApiState>((set) => ({
  spec: null,
  fileName: null,
  rawSpec: null,
  error: null,
  isLoading: false,
  setSpec: (spec, rawSpec, fileName) => set({ spec, rawSpec, fileName, error: null, isLoading: false }),
  setError: (error) => set({ error, spec: null, rawSpec: null, fileName: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ spec: null, rawSpec: null, fileName: null, error: null, isLoading: false }),
}));
