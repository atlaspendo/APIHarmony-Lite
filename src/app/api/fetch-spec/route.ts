
import { NextResponse, type NextRequest } from 'next/server';
import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from 'js-yaml';
import type { OpenAPI } from 'openapi-types';

export async function POST(request: NextRequest) {
  let responseBodyText: string | undefined;
  try {
    const body = await request.json();
    const specUrl = body.url;

    if (!specUrl || typeof specUrl !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string' }, { status: 400 });
    }

    let parsedSpec: OpenAPI.Document;
    let rawSpecTextForOutput: string;

    const externalResponse = await fetch(specUrl);
    responseBodyText = await externalResponse.text(); 

    if (!externalResponse.ok) {
      let errorMsgFromExternalServer = `Failed to fetch spec from URL: ${externalResponse.status} ${externalResponse.statusText}`; // Default
      const contentType = externalResponse.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          const errorJson = JSON.parse(responseBodyText);
          if (errorJson && errorJson.message) {
            errorMsgFromExternalServer = errorJson.message;
          } else if (errorJson && errorJson.error) {
            errorMsgFromExternalServer = errorJson.error;
          } else {
            errorMsgFromExternalServer = `Received status ${externalResponse.status} with non-standard JSON error from external server.`;
          }
        } catch (e) {
          errorMsgFromExternalServer = `External server claimed JSON response for error ${externalResponse.status}, but parsing failed.`;
        }
      } else if (responseBodyText.toLowerCase().includes("<!doctype html>")) {
        errorMsgFromExternalServer = `Failed to fetch. External server returned an HTML page for status ${externalResponse.status}. This often indicates an authentication issue or a misconfigured URL.`;
      } else if (responseBodyText.length > 0) {
        errorMsgFromExternalServer = `Failed to fetch. External server returned unexpected non-JSON, non-HTML content for status ${externalResponse.status}. Preview (first 100 chars): ${responseBodyText.substring(0, 100)}`;
      }
      // If responseBodyText is empty, the default message with statusText is used.
      throw new Error(errorMsgFromExternalServer);
    }
    
    // If externalResponse.ok is true
    try {
      // Try parsing as YAML first, as it's a superset of JSON and more common for OpenAPI.
      parsedSpec = YAML.load(responseBodyText) as OpenAPI.Document;
      if (typeof parsedSpec !== 'object' || parsedSpec === null) {
          // If YAML.load results in non-object (e.g. simple string), it's not a valid spec.
          // This might also happen if it's actually JSON and YAML.load has an issue with it.
          // Try JSON parsing as a fallback.
          throw new Error("Parsed YAML is not a valid object, trying JSON.");
      }
    } catch (yamlError) {
      try {
        // Fallback to parsing as JSON
        parsedSpec = JSON.parse(responseBodyText) as OpenAPI.Document;
        if (typeof parsedSpec !== 'object' || parsedSpec === null) {
            throw new Error("Parsed JSON is not a valid object.");
        }
      } catch (jsonError: any) {
        console.error('Error parsing spec as YAML or JSON:', { yamlError, jsonError });
        throw new Error(`Failed to parse specification. Content is not valid YAML or JSON. YAML error: ${(yamlError as Error).message}, JSON error: ${jsonError.message}`);
      }
    }

    // Validate and bundle the spec (SwaggerParser expects a JS object)
    // Ensure parsedSpec is a plain JS object for SwaggerParser
    const specToValidate = JSON.parse(JSON.stringify(parsedSpec));
    parsedSpec = await SwaggerParser.validate(specToValidate) as OpenAPI.Document;
    rawSpecTextForOutput = YAML.dump(parsedSpec); // Convert back to YAML for consistent storage/display
    
    return NextResponse.json({ specObject: parsedSpec, rawSpecText: rawSpecTextForOutput });

  } catch (error: any) {
    console.error('Error in fetch-spec proxy:', error);
    let finalErrorMessage = "An unexpected error occurred while fetching or parsing the specification.";

    if (error && error.message) {
      finalErrorMessage = error.message; // Default to the caught error's message

      // More specific refinement based on known error message patterns
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('EAI_AGAIN')) {
        finalErrorMessage = `Network error: Could not resolve or connect to the host. Please check the URL and your network connection. Original detail: ${error.message}`;
      } else if (error.message.startsWith('Failed to fetch. External server returned an HTML page') ||
                 error.message.startsWith('External server claimed JSON response for error') ||
                 error.message.startsWith('Received status') || 
                 error.message.startsWith('Failed to fetch. External server returned unexpected non-JSON, non-HTML content') ||
                 error.message.startsWith('Failed to parse specification. Content is not valid YAML or JSON')) {
        // These messages are already specific enough.
        finalErrorMessage = error.message;
      } else if (error.message.includes('Failed to fetch spec from URL')) { 
        // This is a general fallback from the external fetch failure, might include statusText.
        finalErrorMessage = error.message;
      }
    }
    
    return NextResponse.json({ error: finalErrorMessage }, { status: 500 });
  }
}
