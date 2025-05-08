
"use client";

import { useOpenApiStore } from "@/stores/openapi-store";
import type { OpenAPIV3 } from 'openapi-types';
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

  // This component primarily supports OpenAPI V3 for detailed dependency analysis.
  if (!('openapi' in spec && spec.openapi.startsWith('3.'))) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icons.Info />Unsupported Specification Version</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Dependency graph analysis is currently optimized for OpenAPI V3 specifications.
          </p>
        </CardContent>
      </Card>
    );
  }
  const v3Spec = spec as OpenAPIV3.Document;

  const schemaUsageMap = new Map<string, SchemaUsage>();

  // Initialize map
  if (v3Spec.components?.schemas) {
    for (const schemaName in v3Spec.components.schemas) {
      schemaUsageMap.set(schemaName, { operations: [], referencedBySchemas: [] });
    }
  }

  // Helper to find $ref values
  const findRefs = (obj: any, currentSchemaName?: string): string[] => {
    const refs: string[] = [];
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key === '$ref' && typeof obj[key] === 'string') {
          const refPath = obj[key] as string;
          if (refPath.startsWith('#/components/schemas/')) {
            const refSchemaName = refPath.substring('#/components/schemas/'.length);
            refs.push(refSchemaName);
            // If we are analyzing a specific schema's properties, record the dependency
            if (currentSchemaName && schemaUsageMap.has(refSchemaName)) {
                const referencedSchemaEntry = schemaUsageMap.get(refSchemaName)!;
                if (!referencedSchemaEntry.referencedBySchemas.includes(currentSchemaName)){
                    referencedSchemaEntry.referencedBySchemas.push(currentSchemaName);
                }
            }
          }
        } else {
          refs.push(...findRefs(obj[key], currentSchemaName));
        }
      }
    }
    return refs;
  };
  
  // Analyze schema properties for inter-schema references
  if (v3Spec.components?.schemas) {
    for (const schemaName in v3Spec.components.schemas) {
        const schemaObject = v3Spec.components.schemas[schemaName];
        findRefs(schemaObject, schemaName);
    }
  }


  // Analyze paths for schema usage
  if (v3Spec.paths) {
    for (const path in v3Spec.paths) {
      const pathItem = v3Spec.paths[path];
      if (!pathItem) continue;
      for (const method in pathItem) {
        if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method.toLowerCase())) continue;
        
        const operation = pathItem[method as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
        if (!operation) continue;

        // Check requestBody
        if (operation.requestBody && 'content' in operation.requestBody) {
          for (const contentType in operation.requestBody.content) {
            const mediaType = operation.requestBody.content[contentType];
            if (mediaType.schema) {
              findRefs(mediaType.schema).forEach(refSchemaName => {
                if (schemaUsageMap.has(refSchemaName)) {
                  schemaUsageMap.get(refSchemaName)!.operations.push({ path, method, type: 'requestBody' });
                }
              });
            }
          }
        }

        // Check responses
        if (operation.responses) {
          for (const statusCode in operation.responses) {
            const response = operation.responses[statusCode];
            if (response && 'content' in response) {
              for (const contentType in response.content) {
                const mediaType = response.content[contentType];
                if (mediaType.schema) {
                  findRefs(mediaType.schema).forEach(refSchemaName => {
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
          Shows how schemas defined in <code>components/schemas</code> are used by operations or other schemas.
          A full visual graph is complex; this provides a list-based view of relationships.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasDependencies && <p className="text-muted-foreground">No schema dependencies found or no schemas defined in components.</p>}
        {hasDependencies && (
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
