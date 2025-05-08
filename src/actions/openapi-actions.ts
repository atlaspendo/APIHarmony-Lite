'use server';

import { prisma } from '@/lib/prisma';
import type { OpenApiSpec } from '@prisma/client'; // Prisma generated type
import { Prisma } from '@prisma/client'; // Import Prisma for error types

const OPENSSL_ERROR_MESSAGE = "Database connection failed: The required OpenSSL library (libssl.so.1.1 or compatible) is missing. Please install it on your system. This library is essential for Prisma to connect. Also, verify your DATABASE_URL in .env and check server logs for more context if the issue persists after installing OpenSSL.";

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
  } catch (error: any) {
    console.error('Error saving OpenAPI spec:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P1003') {
        throw new Error(
          'Database or table not found. Please ensure migrations have been run: `npx prisma migrate dev` and the database is accessible.'
        );
      }
      throw new Error(
        `A Prisma error occurred (Code: ${error.code}) while saving the OpenAPI specification. Details: ${error.message}. Please check server logs and ensure your database is correctly configured and accessible.`
      );
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      if (error.message.includes('libssl') || error.message.includes('openssl')) {
        throw new Error(OPENSSL_ERROR_MESSAGE);
      }
      throw new Error(
        `Database connection failed (Prisma Initialization Error: ${error.message}) while saving. Ensure the database server is running and accessible, and check your DATABASE_URL in .env.`
      );
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
        throw new Error(
            `A critical Prisma engine error occurred (Rust Panic) while saving. Please check server logs for details. Details: ${error.message}`
        );
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        throw new Error(
            `An unknown Prisma database error occurred while saving. Please check server logs for details. Details: ${error.message}`
        );
    }
    const errorMessage = error.message || 'An unknown issue occurred.';
    throw new Error(
      `An unexpected error occurred while saving the OpenAPI specification to the database. Details: ${errorMessage}. Check server logs for more.`
    );
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
  } catch (error: any) {
    console.error('Error fetching OpenAPI specs:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P1003') {
        throw new Error(
          'Database or table not found. Please ensure migrations have been run: `npx prisma migrate dev` and the database is accessible.'
        );
      }
      throw new Error(
        `A Prisma error occurred (Code: ${error.code}) while fetching OpenAPI specifications. Details: ${error.message}. Please check server logs and ensure your database is correctly configured and accessible.`
      );
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      if (error.message.includes('libssl') || error.message.includes('openssl')) {
         throw new Error(OPENSSL_ERROR_MESSAGE);
      }
      throw new Error(
        `Database connection failed (Prisma Initialization Error: ${error.message}). Ensure the database server is running and accessible, and check your DATABASE_URL in .env.`
      );
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
        throw new Error(
            `A critical Prisma engine error occurred (Rust Panic). Please check server logs for details. Details: ${error.message}`
        );
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        throw new Error(
            `An unknown Prisma database error occurred. Please check server logs for details. Details: ${error.message}`
        );
    }
    const errorMessage = error.message || 'An unknown issue occurred.';
    throw new Error(
      `An unexpected error occurred while fetching OpenAPI specifications from the database. Details: ${errorMessage}. Check server logs for more.`
    );
  }
}

export async function getOpenApiSpecById(id: string): Promise<OpenApiSpec | null> {
  try {
    const spec = await prisma.openApiSpec.findUnique({
      where: { id },
    });
    return spec;
  } catch (error: any) {
    console.error(`Error fetching OpenAPI spec with ID ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P1003') {
        throw new Error(
          `Database or table not found when fetching spec ID ${id}. Ensure migrations are run: \`npx prisma migrate dev\` and the database is accessible.`
        );
      }
      throw new Error(
        `A Prisma error occurred (Code: ${error.code}) while fetching OpenAPI specification (ID: ${id}). Details: ${error.message}. Please check server logs and ensure your database is correctly configured and accessible.`
      );
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      if (error.message.includes('libssl') || error.message.includes('openssl')) {
        throw new Error(OPENSSL_ERROR_MESSAGE);
      }
      throw new Error(
        `Database connection failed (Prisma Initialization Error: ${error.message}) while fetching spec ID ${id}. Ensure the database server is running and accessible, and check your DATABASE_URL in .env.`
      );
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
        throw new Error(
            `A critical Prisma engine error occurred (Rust Panic) while fetching spec ID ${id}. Please check server logs for details. Details: ${error.message}`
        );
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        throw new Error(
            `An unknown Prisma database error occurred while fetching spec ID ${id}. Please check server logs for details. Details: ${error.message}`
        );
    }
    const errorMessage = error.message || 'An unknown issue occurred.';
    throw new Error(
      `An unexpected error occurred while fetching OpenAPI specification (ID: ${id}) from the database. Details: ${errorMessage}. Check server logs for more.`
    );
  }
}

export async function deleteOpenApiSpec(id: string): Promise<OpenApiSpec> {
    try {
        const deletedSpec = await prisma.openApiSpec.delete({
            where: { id },
        });
        return deletedSpec;
    } catch (error: any) {
        console.error(`Error deleting OpenAPI spec with ID ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2021' || error.code === 'P1003') {
            throw new Error(
              `Database or table not found when deleting spec ID ${id}. Ensure migrations are run: \`npx prisma migrate dev\` and the database is accessible.`
            );
          } else if (error.code === 'P2025') { // Record to delete not found
             throw new Error(`OpenAPI specification with ID ${id} not found for deletion.`);
          }
          throw new Error(
            `A Prisma error occurred (Code: ${error.code}) while deleting OpenAPI specification (ID: ${id}). Details: ${error.message}. Please check server logs and ensure your database is correctly configured and accessible.`
          );
        } else if (error instanceof Prisma.PrismaClientInitializationError) {
          if (error.message.includes('libssl') || error.message.includes('openssl')) {
            throw new Error(OPENSSL_ERROR_MESSAGE);
          }
          throw new Error(
            `Database connection failed (Prisma Initialization Error: ${error.message}) while deleting spec ID ${id}. Ensure the database server is running and accessible, and check your DATABASE_URL in .env.`
          );
        } else if (error instanceof Prisma.PrismaClientRustPanicError) {
            throw new Error(
                `A critical Prisma engine error occurred (Rust Panic) while deleting spec ID ${id}. Please check server logs for details. Details: ${error.message}`
            );
        } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
            throw new Error(
                `An unknown Prisma database error occurred while deleting spec ID ${id}. Please check server logs for details. Details: ${error.message}`
            );
        }
        const errorMessage = error.message || 'An unknown issue occurred.';
        throw new Error(
          `An unexpected error occurred while deleting OpenAPI specification (ID: ${id}) from the database. Details: ${errorMessage}. Check server logs for more.`
        );
    }
}

