
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
    let rawSpecText: string;

    const response = await fetch(specUrl);
    responseBodyText = await response.text(); 

    if (!response.ok) {
      let errorMsgFromServer = `Failed to fetch spec from URL: ${response.status} ${response.statusText}`;
      
      try {
        if (response.headers.get('content-type')?.includes('application/json')) {
            const errorJson = JSON.parse(responseBodyText); 
            if (errorJson && errorJson.message) { 
              errorMsgFromServer = errorJson.message;
            } else if (errorJson && errorJson.error) {
              errorMsgFromServer = errorJson.error;
            } else {
                errorMsgFromServer = `Received status ${response.status} with non-standard JSON error: ${responseBodyText.substring(0,200)}`;
            }
        } else if (responseBodyText && responseBodyText.toLowerCase().includes("<!doctype html>")) {
             errorMsgFromServer = `Failed to fetch. Server returned an HTML page instead of a spec (Status: ${response.status})`;
        } else if (responseBodyText && responseBodyText.length > 0 && responseBodyText.length < 300) { 
            errorMsgFromServer = `Non-JSON error from server (${response.status}): ${responseBodyText.substring(0, 300)}`;
        } else if (responseBodyText && responseBodyText.length === 0 && response.statusText) {
            errorMsgFromServer = `Server returned status ${response.status} ${response.statusText} with an empty body.`;
        } else {
            // Fallback to the original generic message if no specific condition met
             errorMsgFromServer = `Failed to fetch spec from URL: ${response.status} ${response.statusText}. Response body: ${responseBodyText.substring(0,200)}`;
        }
      } catch (jsonParseError) {
        // If JSON parsing fails or content-type is not JSON, use the text based error checks from original logic
        if (responseBodyText && responseBodyText.toLowerCase().includes("<!doctype html>")) {
            errorMsgFromServer = `Failed to fetch. Server returned an HTML page instead of a spec (Status: ${response.status})`;
        } else if (responseBodyText && responseBodyText.length > 0 && responseBodyText.length < 300) {
            errorMsgFromServer = `Non-JSON error from server (${response.status}): ${responseBodyText.substring(0, 300)}`;
        } else if (responseBodyText && responseBodyText.length === 0 && response.statusText) {
             errorMsgFromServer = `Server returned status ${response.status} ${response.statusText} with an empty body.`;
        } else {
            errorMsgFromServer = `Failed to fetch spec, status ${response.status}. Error parsing response body. Body: ${responseBodyText.substring(0,200)}`;
        }
      }
      throw new Error(errorMsgFromServer); 
    }
    
    try {
      // Try parsing as YAML first
      parsedSpec = YAML.load(responseBodyText) as OpenAPI.Document;
      if (typeof parsedSpec !== 'object' || parsedSpec === null) { // Basic validation if YAML.load returns non-object
          throw new Error("Parsed YAML is not a valid object.");
      }
      // Bundle (which resolves $refs) might modify the object, so re-stringify to YAML for rawSpecText
      parsedSpec = await SwaggerParser.bundle(JSON.parse(JSON.stringify(parsedSpec))) as OpenAPI.Document; // Ensure a deep copy for bundling
      rawSpecText = YAML.dump(parsedSpec); 
    } catch (yamlError) {
      try {
        // If YAML parsing fails, try parsing as JSON
        parsedSpec = JSON.parse(responseBodyText) as OpenAPI.Document;
        if (typeof parsedSpec !== 'object' || parsedSpec === null) { // Basic validation for JSON
            throw new Error("Parsed JSON is not a valid object.");
        }
        parsedSpec = await SwaggerParser.bundle(JSON.parse(JSON.stringify(parsedSpec))) as OpenAPI.Document; // Ensure a deep copy
        rawSpecText = YAML.dump(parsedSpec); // Convert potentially modified JSON back to YAML for consistency
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
        // More specific error messages based on common issues
        if (error.message.includes('Failed to fetch') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('EAI_AGAIN') || error.message.includes('HTTP ERROR')) {
            errorMessage = `Could not connect to or retrieve the specification from the URL. Please check the URL and network connectivity. Details: ${error.message}`;
        } else if (error.message.startsWith('Non-JSON error from server') || error.message.startsWith('Failed to fetch. Server returned an HTML page')) {
            errorMessage = error.message; // Use the already specific message
        } else if (error.message.startsWith('Received status') && error.message.includes('non-standard JSON error')) {
            errorMessage = error.message; // Use the specific JSON error message
        } else if (responseBodyText && responseBodyText.toLowerCase().includes("<!doctype html>")) { 
            errorMessage = `Failed to fetch. Server returned an HTML page instead of a spec.`;
        } else {
            errorMessage = error.message; // Default to the error's message if it's somewhat descriptive
        }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
