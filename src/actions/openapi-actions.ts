'use server';

import { prisma } from '@/lib/prisma';
import type { OpenApiSpec } from '@prisma/client'; // Prisma generated type
import { Prisma } from '@prisma/client'; // Import Prisma for error types

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2021: Table does not exist. P1003: Database file does not exist.
      if (error.code === 'P2021' || error.code === 'P1003') { 
        throw new Error(
          'Database or table not found. Please ensure migrations have been run: `npx prisma migrate dev` and the database is accessible.'
        );
      }
    }
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
       // P2021: Table does not exist. P1003: Database file does not exist.
      if (error.code === 'P2021' || error.code === 'P1003') {
        throw new Error(
          'Database or table not found. Please ensure migrations have been run: `npx prisma migrate dev` and the database is accessible.'
        );
      }
    }
    throw new Error('Failed to fetch OpenAPI specifications from the database. Check server logs for details.');
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P1003') {
        throw new Error(
          `Database or table not found when fetching spec ID ${id}. Ensure migrations are run: \`npx prisma migrate dev\`.`
        );
      }
    }
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
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2021' || error.code === 'P1003') {
            throw new Error(
              `Database or table not found when deleting spec ID ${id}. Ensure migrations are run: \`npx prisma migrate dev\`.`
            );
          } else if (error.code === 'P2025') { // Record to delete not found
             throw new Error(`OpenAPI specification with ID ${id} not found for deletion.`);
          }
        }
        throw new Error(`Failed to delete OpenAPI specification (ID: ${id}) from the database.`);
    }
}
