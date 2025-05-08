'use server';

import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// Define a local OpenApiSpec type as Prisma is removed
export interface OpenApiSpec {
  id: string;
  name: string;
  content: string; // JSON string of the parsed spec
  rawContent: string; // Original YAML or JSON string
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
}

const LOCAL_STORAGE_KEY = 'apiHarmonyLiteSpecs';

// Helper function to get specs from localStorage
const getSpecsFromLocalStorage = (): OpenApiSpec[] => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []; // localStorage not available (e.g., during SSR for actions)
  }
  const specsJson = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  return specsJson ? JSON.parse(specsJson) : [];
};

// Helper function to save specs to localStorage
const saveSpecsToLocalStorage = (specs: OpenApiSpec[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(specs));
};

export async function saveOpenApiSpec(
  name: string,
  content: string, // This should be the parsed/validated spec, perhaps as a JSON string
  rawContent: string // The original YAML or JSON string
): Promise<OpenApiSpec> {
  try {
    const specs = getSpecsFromLocalStorage();
    const now = new Date().toISOString();
    const newSpec: OpenApiSpec = {
      id: uuidv4(),
      name,
      content,
      rawContent,
      createdAt: now,
      updatedAt: now,
    };
    specs.push(newSpec);
    saveSpecsToLocalStorage(specs);
    return newSpec;
  } catch (error: any) {
    console.error('Error saving OpenAPI spec to localStorage:', error);
    throw new Error(`Failed to save OpenAPI spec: ${error.message}`);
  }
}

export async function getOpenApiSpecs(): Promise<OpenApiSpec[]> {
  try {
    const specs = getSpecsFromLocalStorage();
    // Sort by updatedAt descending
    return specs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error: any) {
    console.error('Error fetching OpenAPI specs from localStorage:', error);
    throw new Error(`Failed to fetch OpenAPI specs: ${error.message}`);
  }
}

export async function getOpenApiSpecById(id: string): Promise<OpenApiSpec | null> {
  try {
    const specs = getSpecsFromLocalStorage();
    const spec = specs.find((s) => s.id === id) || null;
    return spec;
  } catch (error: any) {
    console.error(`Error fetching OpenAPI spec with ID ${id} from localStorage:`, error);
    throw new Error(`Failed to fetch OpenAPI spec by ID: ${error.message}`);
  }
}

export async function deleteOpenApiSpec(id: string): Promise<OpenApiSpec> {
  try {
    let specs = getSpecsFromLocalStorage();
    const specToDelete = specs.find((s) => s.id === id);
    if (!specToDelete) {
      throw new Error(`OpenAPI specification with ID ${id} not found for deletion.`);
    }
    specs = specs.filter((s) => s.id !== id);
    saveSpecsToLocalStorage(specs);
    return specToDelete;
  } catch (error: any) {
    console.error(`Error deleting OpenAPI spec with ID ${id} from localStorage:`, error);
    throw new Error(`Failed to delete OpenAPI spec: ${error.message}`);
  }
}
