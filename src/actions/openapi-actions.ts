'use server';

import { prisma } from '@/lib/prisma';
import type { OpenApiSpec } from '@prisma/client'; // Prisma generated type

export async function saveOpenApiSpec(
  name: string,
  content: string, // This should be the parsed/validated spec, perhaps as a JSON string
  rawContent: string // The original YAML or JSON string
): Promise<OpenApiSpec> {
  try {
    const newSpec = await prisma.openApiSpec.create({
      data: {
        name,
        content,
        rawContent,
      },
    });
    return newSpec;
  } catch (error) {
    console.error('Error saving OpenAPI spec:', error);
    throw new Error('Failed to save OpenAPI specification to the database.');
  }
}

export async function getOpenApiSpecs(): Promise<OpenApiSpec[]> {
  try {
    const specs = await prisma.openApiSpec.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return specs;
  } catch (error) {
    console.error('Error fetching OpenAPI specs:', error);
    throw new Error('Failed to fetch OpenAPI specifications from the database.');
  }
}

export async function getOpenApiSpecById(id: string): Promise<OpenApiSpec | null> {
  try {
    const spec = await prisma.openApiSpec.findUnique({
      where: { id },
    });
    return spec;
  } catch (error) {
    console.error(`Error fetching OpenAPI spec with ID ${id}:`, error);
    throw new Error(`Failed to fetch OpenAPI specification (ID: ${id}) from the database.`);
  }
}

export async function deleteOpenApiSpec(id: string): Promise<OpenApiSpec> {
    try {
        const deletedSpec = await prisma.openApiSpec.delete({
            where: { id },
        });
        return deletedSpec;
    } catch (error) {
        console.error(`Error deleting OpenAPI spec with ID ${id}:`, error);
        throw new Error(`Failed to delete OpenAPI specification (ID: ${id}) from the database.`);
    }
}
