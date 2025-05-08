
import { NextResponse, type NextRequest } from 'next/server';
import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from 'js-yaml';
import type { OpenAPI } from 'openapi-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const specUrl = body.url;

    if (!specUrl || typeof specUrl !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string' }, { status: 400 });
    }

    // Fetch, parse, and bundle the specification using SwaggerParser
    // .bundle() will resolve external $refs and validate
    const parsedSpec = await SwaggerParser.bundle(specUrl) as OpenAPI.Document;
    
    // Convert the potentially modified/bundled spec to YAML for consistency
    // This ensures the rawSpecText matches what was processed
    const rawSpecText = YAML.dump(parsedSpec);

    return NextResponse.json({ specObject: parsedSpec, rawSpecText });

  } catch (error: any) {
    console.error('Error fetching or parsing spec from URL via proxy:', error);
    // Provide a user-friendly error message, but log the detailed error on the server.
    let errorMessage = "Failed to fetch or parse OpenAPI specification from the provided URL.";
    // SwaggerParser errors often contain useful details.
    if (error && error.message) {
        // Check for common fetch-related issues or SwaggerParser messages
        if (error.message.includes('Failed to fetch') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            errorMessage = `Could not connect to or retrieve the specification from the URL: ${error.message}`;
        } else {
            errorMessage = error.message; // Use SwaggerParser's message if it's more specific
        }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
