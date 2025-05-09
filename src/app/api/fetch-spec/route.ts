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

    let parsedSpec: OpenAPI.Document;
    let rawSpecText: string;

    // Try fetching and parsing
    const response = await fetch(specUrl);
    let responseBodyText: string; // Declare here to be accessible after the if block

    if (!response.ok) {
      responseBodyText = await response.text(); // Read the body for error details
      let errorMsgFromServer = `Failed to fetch spec from URL: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(responseBodyText);
        if (errorJson && errorJson.error) {
          errorMsgFromServer = errorJson.error;
        } else if (responseBodyText.length > 0 && responseBodyText.length < 200) {
            errorMsgFromServer = responseBodyText;
        }
      } catch (jsonParseError) {
        if (responseBodyText && responseBodyText.length > 0 && !responseBodyText.toLowerCase().includes("<!doctype html>")) {
            errorMsgFromServer = `Non-JSON error from server (${response.status}): ${responseBodyText.substring(0, 200)}`;
        } else if (responseBodyText.toLowerCase().includes("<!doctype html>")) {
            errorMsgFromServer = `Failed to fetch. Server returned an HTML page instead of a spec (Status: ${response.status})`;
        }
      }
      throw new Error(errorMsgFromServer);
    }
    
    // If response.ok is true
    responseBodyText = await response.text(); // Read the body for successful parsing

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
    
    if (error && error.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('EAI_AGAIN')) {
            errorMessage = `Could not connect to or retrieve the specification from the URL. Please check the URL and network connectivity. Details: ${error.message}`;
        } else {
            errorMessage = error.message; 
        }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
