import { NextResponse, type NextRequest } from 'next/server';
import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from 'js-yaml';
import type { OpenAPI } from 'openapi-types';

export async function POST(request: NextRequest) {
  let responseBodyText: string | undefined; // Declare here to be accessible after the if block
  try {
    const body = await request.json();
    const specUrl = body.url;

    if (!specUrl || typeof specUrl !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string' }, { status: 400 });
    }

    let parsedSpec: OpenAPI.Document;
    let rawSpecText: string;

    // Try fetching and parsing
    const response = await fetch(specUrl);
    
    // Read the body text once, regardless of success or failure, to avoid "Body has already been read" error
    responseBodyText = await response.text();

    if (!response.ok) {
      let errorMsgFromServer = `Failed to fetch spec from URL: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(responseBodyText); // Try to parse the already read body
        if (errorJson && errorJson.error) {
          errorMsgFromServer = errorJson.error;
        } else if (responseBodyText.length > 0 && responseBodyText.length < 200) { // Use up to 200 chars of body as error if not JSON
            errorMsgFromServer = responseBodyText;
        }
      } catch (jsonParseError) {
        // If JSON parsing fails, check if it's HTML or short text
        if (responseBodyText && responseBodyText.toLowerCase().includes("<!doctype html>")) {
            errorMsgFromServer = `Failed to fetch. Server returned an HTML page instead of a spec (Status: ${response.status})`;
        } else if (responseBodyText && responseBodyText.length > 0 && responseBodyText.length < 200) {
            errorMsgFromServer = `Non-JSON error from server (${response.status}): ${responseBodyText.substring(0, 200)}`;
        }
        // If responseBodyText is empty and statusText is not useful, the initial default message is used.
      }
      
      throw new Error(errorMsgFromServer); 
    }
    // If response.ok is true, responseBodyText has already been read
    
    try {
      // Try parsing as YAML first
      parsedSpec = YAML.load(responseBodyText) as OpenAPI.Document;
      // Validate and bundle (which also converts to a standard JS object structure)
      parsedSpec = await SwaggerParser.bundle(JSON.parse(JSON.stringify(parsedSpec))) as OpenAPI.Document;
      rawSpecText = YAML.dump(parsedSpec); // Convert the bundled spec back to YAML for rawSpecText
    } catch (yamlError) {
      // If YAML parsing fails, try JSON
      try {
        parsedSpec = JSON.parse(responseBodyText) as OpenAPI.Document;
        // Validate and bundle
        parsedSpec = await SwaggerParser.bundle(JSON.parse(JSON.stringify(parsedSpec))) as OpenAPI.Document;
        rawSpecText = YAML.dump(parsedSpec); // Convert the bundled spec to YAML for rawSpecText
      } catch (jsonError: any) {
        console.error('Error parsing spec as YAML or JSON:', { yamlError, jsonError });
        throw new Error(`Failed to parse specification. Content is not valid YAML or JSON. Original error: ${jsonError.message}`);
      }
    }
    

    return NextResponse.json({ specObject: parsedSpec, rawSpecText });

  } catch (error: any) {
    console.error('Error in fetch-spec proxy:', error);
    let errorMessage = "Failed to fetch or parse OpenAPI specification from the provided URL.";
    
    // Check if the error message already indicates a specific problem (like network error)
    if (error && error.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('EAI_AGAIN') || error.message.includes('HTTP ERROR')) {
            errorMessage = `Could not connect to or retrieve the specification from the URL. Please check the URL and network connectivity. Details: ${error.message}`;
        } else if (error.message.startsWith('Non-JSON error from server') || error.message.startsWith('Failed to fetch. Server returned an HTML page')) {
            errorMessage = error.message; // Use the more specific error message already crafted
        } else if (responseBodyText && responseBodyText.toLowerCase().includes("<!doctype html>")) {
            // This case might be redundant if caught above but good as a fallback
            errorMessage = `Failed to fetch. Server returned an HTML page instead of a spec.`;
        } else {
             // Use the error message directly if it's from parsing or other issues
            errorMessage = error.message;
        }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
