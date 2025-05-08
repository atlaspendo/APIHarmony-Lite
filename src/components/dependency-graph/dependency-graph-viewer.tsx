
"use client";

import { useOpenApiStore } from "@/stores/openapi-store";
import type { OpenAPI, OpenAPIV3, OpenAPIV2 } from 'openapi-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SchemaUsage {
  operations: { path: string; method: string; type: 'requestBody' | 'response' }[];
  referencedBySchemas: string[]; // Schemas that reference this schema
}

// Helper to check if it's an OpenAPI V3 document
function isOpenAPIV3(doc: OpenAPI.Document | null | undefined): doc is OpenAPIV3.Document {
  return !!doc && 'openapi' in doc && typeof doc.openapi === 'string' && doc.openapi.startsWith('3.');
}

// Helper to check if it's an OpenAPI V2 document (Swagger)
function isOpenAPIV2(doc: OpenAPI.Document | null | undefined): doc is OpenAPIV2.Document {
  return !!doc && 'swagger' in doc && typeof doc.swagger === 'string' && doc.swagger.startsWith('2.');
}


export function DependencyGraphViewer() {
  const { spec, error: specError } = useOpenApiStore();

  if (specError) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Icons.AlertTriangle /> Error Loading Specification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive p-3 rounded-md">{specError}</p>
           <p className="mt-4 text-sm">
            Please try importing the specification again via the <a href="/" className="underline text-primary hover:text-primary/80">Import page</a>.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!spec) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icons.Info />No API Specification Loaded</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please import an OpenAPI specification first using the <a href="/" className="underline text-primary hover:text-primary/80">Import page</a> to view dependencies.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isV3 = isOpenAPIV3(spec);
  const isV2 = isOpenAPIV2(spec);

  if (!isV3 && !isV2) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icons.Info />Unsupported Specification Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Dependency graph analysis currently supports OpenAPI V3 and V2 specifications. The loaded specification is not recognized as either.
          </p>
        </CardContent>
      </Card>
    );
  }

  const schemaUsageMap = new Map<string, SchemaUsage>();
  let schemasContainer: Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | OpenAPIV2.SchemaObject | OpenAPIV2.ReferenceObject> | undefined;
  let refPrefix: string;

  if (isV3) {
    schemasContainer = (spec as OpenAPIV3.Document).components?.schemas;
    refPrefix = '#/components/schemas/';
  } else { // isV2
    schemasContainer = (spec as OpenAPIV2.Document).definitions;
    refPrefix = '#/definitions/';
  }

  // Initialize map
  if (schemasContainer) {
    for (const schemaName in schemasContainer) {
      schemaUsageMap.set(schemaName, { operations: [], referencedBySchemas: [] });
    }
  }

  // Helper to find $ref values
  const findRefs = (obj: any, currentSchemaName?: string, currentRefPrefix?: string): string[] => {
    const effectiveRefPrefix = currentRefPrefix || refPrefix; // Use passed prefix or default
    const refs: string[] = [];
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key === '$ref' && typeof obj[key] === 'string') {
          const refPath = obj[key] as string;
          if (refPath.startsWith(effectiveRefPrefix)) {
            const refSchemaName = refPath.substring(effectiveRefPrefix.length);
            refs.push(refSchemaName);
            if (currentSchemaName && schemaUsageMap.has(refSchemaName)) {
                const referencedSchemaEntry = schemaUsageMap.get(refSchemaName)!;
                if (!referencedSchemaEntry.referencedBySchemas.includes(currentSchemaName)){
                    referencedSchemaEntry.referencedBySchemas.push(currentSchemaName);
                }
            }
          }
        } else {
          refs.push(...findRefs(obj[key], currentSchemaName, currentRefPrefix));
        }
      }
    }
    return refs;
  };
  
  // Analyze schema properties for inter-schema references
  if (schemasContainer) {
    for (const schemaName in schemasContainer) {
        const schemaObject = schemasContainer[schemaName];
        findRefs(schemaObject, schemaName, refPrefix);
    }
  }

  // Analyze paths for schema usage
  if (spec.paths) {
    for (const path in spec.paths) {
      const pathItem = spec.paths[path] as OpenAPIV3.PathItemObject | OpenAPIV2.PathItemObject; // Type assertion
      if (!pathItem) continue;

      for (const method in pathItem) {
        if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method.toLowerCase())) continue;
        
        const operation = pathItem[method as keyof typeof pathItem];
        if (!operation || typeof operation !== 'object' || !('responses' in operation)) continue; // Basic check for operation structure

        if (isV3) {
          const v3Operation = operation as OpenAPIV3.OperationObject;
          // Check requestBody for V3
          if (v3Operation.requestBody && 'content' in v3Operation.requestBody) {
            for (const contentType in v3Operation.requestBody.content) {
              const mediaType = v3Operation.requestBody.content[contentType];
              if (mediaType.schema) {
                findRefs(mediaType.schema, undefined, refPrefix).forEach(refSchemaName => {
                  if (schemaUsageMap.has(refSchemaName)) {
                    schemaUsageMap.get(refSchemaName)!.operations.push({ path, method, type: 'requestBody' });
                  }
                });
              }
            }
          }
          // Check responses for V3
          if (v3Operation.responses) {
            for (const statusCode in v3Operation.responses) {
              const response = v3Operation.responses[statusCode];
              if (response && 'content' in response && response.content) {
                for (const contentType in response.content) {
                  const mediaType = response.content[contentType];
                  if (mediaType.schema) {
                    findRefs(mediaType.schema, undefined, refPrefix).forEach(refSchemaName => {
                      if (schemaUsageMap.has(refSchemaName)) {
                        schemaUsageMap.get(refSchemaName)!.operations.push({ path, method, type: 'response' });
                      }
                    });
                  }
                }
              }
            }
          }
        } else { // isV2
          const v2Operation = operation as OpenAPIV2.OperationObject;
          // Check parameters for requestBody (V2 style)
          if (v2Operation.parameters) {
            for (const param of v2Operation.parameters) {
              // Parameter can be ReferenceObject or ParameterObject
              if (!('$ref' in param) && param.in === 'body' && param.schema) {
                findRefs(param.schema, undefined, refPrefix).forEach(refSchemaName => {
                  if (schemaUsageMap.has(refSchemaName)) {
                    schemaUsageMap.get(refSchemaName)!.operations.push({ path, method, type: 'requestBody' });
                  }
                });
              }
            }
          }
          // Check responses for V2
          if (v2Operation.responses) {
            for (const statusCode in v2Operation.responses) {
              const response = v2Operation.responses[statusCode];
               // Response can be ReferenceObject or ResponseObject
              if (response && !('$ref' in response) && response.schema) {
                findRefs(response.schema, undefined, refPrefix).forEach(refSchemaName => {
                  if (schemaUsageMap.has(refSchemaName)) {
                    schemaUsageMap.get(refSchemaName)!.operations.push({ path, method, type: 'response' });
                  }
                });
              }
            }
          }
        }
      }
    }
  }
  
  const hasDependencies = Array.from(schemaUsageMap.values()).some(
    usage => usage.operations.length > 0 || usage.referencedBySchemas.length > 0
  );

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icons.GitFork className="w-6 h-6 text-primary" /> API Schema Dependencies
        </CardTitle>
        <CardDescription>
          Shows how schemas (from <code>components/schemas</code> for V3 or <code>definitions</code> for V2) are used by operations or other schemas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!schemasContainer && <p className="text-muted-foreground">No schemas found in the specification (expected in {isV3 ? 'components/schemas' : 'definitions'}).</p>}
        {schemasContainer && !hasDependencies && <p className="text-muted-foreground">No schema dependencies found among the defined schemas.</p>}
        {schemasContainer && hasDependencies && (
          <ScrollArea className="h-[600px]">
            <Accordion type="multiple" className="w-full space-y-2">
              {Array.from(schemaUsageMap.entries()).map(([schemaName, usage]) => (
                (usage.operations.length > 0 || usage.referencedBySchemas.length > 0) && (
                <AccordionItem value={schemaName} key={schemaName} className="border rounded-md shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md">
                    <div className="flex items-center gap-2">
                      <Icons.FileJson className="w-5 h-5 text-accent" />
                      <span className="font-semibold">{schemaName}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-background rounded-b-md">
                    {usage.operations.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-1">Used by Operations:</h4>
                        <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                          {usage.operations.map((op, idx) => (
                            <li key={idx}>
                              <Badge variant="outline" className={`mr-1 method-${op.method.toLowerCase()}`}>{op.method.toUpperCase()}</Badge>
                              <span className="font-mono">{op.path}</span> ({op.type})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {usage.referencedBySchemas.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Referenced by Schemas:</h4>
                         <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                          {usage.referencedBySchemas.map((refName, idx) => (
                            <li key={idx}>
                              <Icons.FileText className="w-3 h-3 inline mr-1 text-muted-foreground"/> {refName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {usage.operations.length === 0 && usage.referencedBySchemas.length === 0 && (
                        <p className="text-xs text-muted-foreground">This schema is defined but not directly used by operations or other schemas in this analysis.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
                )
              ))}
            </Accordion>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
