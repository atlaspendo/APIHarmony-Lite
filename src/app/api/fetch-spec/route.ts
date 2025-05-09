
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
      let errorMsgFromExternalServer = `Request to ${specUrl} failed: ${externalResponse.status} ${externalResponse.statusText}`; // Default
      const contentType = externalResponse.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          const errorJson = JSON.parse(responseBodyText); // responseBodyText is already read
          if (errorJson && errorJson.message) {
            errorMsgFromExternalServer = errorJson.message;
          } else if (errorJson && errorJson.error) {
            errorMsgFromExternalServer = errorJson.error;
          } else {
            errorMsgFromExternalServer = `External server returned status ${externalResponse.status} with non-standard JSON error.`;
          }
        } catch (e) {
          errorMsgFromExternalServer = `External server returned status ${externalResponse.status}, claimed JSON error response, but parsing failed.`;
        }
      } else if (contentType?.includes('text/html')) {
        errorMsgFromExternalServer = `Failed to fetch spec. External server at ${specUrl} returned an HTML page (status ${externalResponse.status} ${externalResponse.statusText}). This could be an error page, authentication prompt, or a misconfigured URL.`;
      } else if (responseBodyText && responseBodyText.length > 0) {
        errorMsgFromExternalServer = `Failed to fetch spec. External server at ${specUrl} returned status ${externalResponse.status} ${externalResponse.statusText} with unexpected content. Preview (first 100 chars): ${responseBodyText.substring(0, 100)}...`;
      }
      // If responseBodyText is empty, the default message with statusText is used.
      
      // This error is caught by the outer try-catch in this same file.
      // That outer catch then creates the finalErrorMessage and returns it as JSON.
      throw new Error(errorMsgFromExternalServer); 
    }
    
    // If externalResponse.ok is true
    try {
      // Try parsing as YAML first, as it's a superset of JSON and more common for OpenAPI.
      parsedSpec = YAML.load(responseBodyText) as OpenAPI.Document;
      if (typeof parsedSpec !== 'object' || parsedSpec === null || !parsedSpec.swagger && !parsedSpec.openapi) {
          // If YAML.load results in non-object (e.g. simple string), it's not a valid spec.
          // This might also happen if it's actually JSON and YAML.load has an issue with it.
          // Try JSON parsing as a fallback.
          throw new Error("Parsed YAML is not a valid OpenAPI object, trying JSON.");
      }
    } catch (yamlError) {
      try {
        // Fallback to parsing as JSON
        parsedSpec = JSON.parse(responseBodyText) as OpenAPI.Document;
        if (typeof parsedSpec !== 'object' || parsedSpec === null || !parsedSpec.swagger && !parsedSpec.openapi) {
            throw new Error("Parsed JSON is not a valid OpenAPI object.");
        }
      } catch (jsonError: any) {
        console.error('Error parsing spec as YAML or JSON:', { yamlError, jsonError });
        throw new Error(`Failed to parse specification from ${specUrl}. Content is not valid YAML or JSON. YAML error: ${(yamlError as Error).message}, JSON error: ${jsonError.message}`);
      }
    }

    // Validate and bundle the spec (SwaggerParser expects a JS object)
    // Ensure parsedSpec is a plain JS object for SwaggerParser
    const specToValidate = JSON.parse(JSON.stringify(parsedSpec));
    // SwaggerParser.validate might throw its own errors if the spec is invalid
    const validatedSpec = await SwaggerParser.validate(specToValidate) as OpenAPI.Document;
    rawSpecTextForOutput = YAML.dump(validatedSpec); // Convert back to YAML for consistent storage/display
    
    return NextResponse.json({ specObject: validatedSpec, rawSpecText: rawSpecTextForOutput });

  } catch (error: any) {
    console.error(`Error in fetch-spec proxy for URL: ${error.specUrl || (request as any).nextUrl?.searchParams?.get('url') || 'Unknown URL'}. Details:`, error.message);
    // The error.message should now be the refined message from the inner throw.
    const finalErrorMessage = error.message || "An unexpected error occurred while fetching or parsing the specification.";
    
    return NextResponse.json({ error: finalErrorMessage }, { status: 500 });
  }
}

