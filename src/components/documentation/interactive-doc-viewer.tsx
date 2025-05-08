
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
import { Icons, ApiMethodIcons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Helper to check if it's an OpenAPI V3 document
function isOpenAPIV3(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return 'openapi' in doc && doc.openapi.startsWith('3.');
}

// Helper to check if it's an OpenAPI V2 document (Swagger)
function isOpenAPIV2(doc: OpenAPI.Document): doc is OpenAPIV2.Document {
  return 'swagger' in doc && doc.swagger.startsWith('2.');
}


const SchemaDisplay = ({ schema, name }: { schema: OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject, name?: string }) => {
  if (!schema) return <p className="text-sm text-muted-foreground">No schema details available.</p>;

  const properties = schema.properties || (schema.type === 'array' && schema.items && (schema.items as any).properties ? (schema.items as any).properties : null);
  const type = schema.type || (properties ? 'object' : 'unknown');
  const enumValues = (schema as any).enum as any[] | undefined;

  return (
    <div className="text-xs p-2 border rounded-md bg-secondary/30 my-1">
      {name && <p className="font-semibold">{name} <Badge variant="outline" className="ml-1">{type}</Badge></p>}
      {!name && <p><Badge variant="outline">{type}</Badge></p>}
      {schema.description && <p className="text-muted-foreground text-xs mt-1">{schema.description}</p>}
      {schema.format && <p className="text-xs text-muted-foreground">Format: {schema.format}</p>}
      
      {enumValues && Array.isArray(enumValues) && enumValues.length > 0 && (
        <div className="mt-1">
          <p className="text-xs font-medium">Enum Values:</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {enumValues.map((val, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs font-normal">{String(val)}</Badge>
            ))}
          </div>
        </div>
      )}

      {schema.example && <pre className="mt-1 p-1 bg-muted rounded text-xs overflow-auto">Example: {JSON.stringify(schema.example, null, 2)}</pre>}
      
      {type === 'array' && schema.items && !(schema.items as any).properties && ( // Handle array of simple types or array of enums
        <div className="ml-4 mt-1">
          <p className="text-xs font-medium">Items type: <Badge variant="outline">{(schema.items as any).type || 'object'}</Badge></p>
          <SchemaDisplay schema={schema.items as OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject} />
        </div>
      )}

      {properties && (
        <Table className="mt-2 text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(properties).map(([propName, propDef]) => {
              const propSchema = propDef as OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject;
              const propEnumValues = (propSchema as any).enum as any[] | undefined;
              return (
                <TableRow key={propName}>
                  <TableCell className="font-mono py-1">{propName}</TableCell>
                  <TableCell className="py-1">
                    {(propSchema as any).type}
                    {(propSchema as any).format ? `(${(propSchema as any).format})` : ''}
                    {/* Display enum values for property if they exist and it's not too verbose */}
                    {propEnumValues && Array.isArray(propEnumValues) && propEnumValues.length > 0 && propEnumValues.length < 6 && ( 
                       <span className="ml-1 text-muted-foreground">({propEnumValues.map(String).join(', ')})</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1">
                    {(propSchema as any).description || '-'}
                    {/* More detailed enum display for properties if too long for type column */}
                    {propEnumValues && Array.isArray(propEnumValues) && propEnumValues.length >= 6 && (
                        <div className="mt-0.5">
                            <p className="text-xxs font-medium text-muted-foreground">Enum:</p>
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                                {propEnumValues.map((val, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xxs px-1 py-0 font-normal">{String(val)}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};


const OperationDetailsV3 = ({ path, method, operation }: { path: string, method: string, operation: OpenAPIV3.OperationObject }) => {
  const HttpIcon = ApiMethodIcons[method.toLowerCase()] || Icons.Network;
  return (
    <AccordionItem value={`${path}-${method}`} className="border-b-0">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 w-full">
          <Badge 
            variant="outline" 
            className={`w-20 justify-center text-xs font-semibold method-${method.toLowerCase()}`}
            style={{
              borderColor: `var(--method-${method.toLowerCase()}-border, hsl(var(--border)))`,
              backgroundColor: `var(--method-${method.toLowerCase()}-bg, hsl(var(--secondary)))`,
              color: `var(--method-${method.toLowerCase()}-fg, hsl(var(--secondary-foreground)))`,
            }}
          >
            <HttpIcon className="w-3 h-3 mr-1.5" />
            {method.toUpperCase()}
          </Badge>
          <span className="font-mono text-sm flex-grow text-left">{path}</span>
          <span className="text-xs text-muted-foreground truncate max-w-xs text-right">{operation.summary}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 bg-card rounded-b-md shadow-inner">
        {operation.description && <p className="text-sm text-muted-foreground mb-3">{operation.description}</p>}
        {operation.tags && operation.tags.length > 0 && (
          <div className="mb-3">
            {operation.tags.map(tag => <Badge key={tag} variant="secondary" className="mr-1">{tag}</Badge>)}
          </div>
        )}

        {operation.parameters && operation.parameters.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-md mb-2">Parameters</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Schema</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operation.parameters.map((param, idx) => {
                  const p = param as OpenAPIV3.ParameterObject;
                  return (
                    <TableRow key={p.name + idx}>
                      <TableCell className="font-mono">{p.name}</TableCell>
                      <TableCell>{p.in}</TableCell>
                      <TableCell>{p.required ? <Icons.CheckCircle2 className="text-green-500 w-4 h-4"/> : <Icons.XCircle className="text-red-500 w-4 h-4"/>}</TableCell>
                      <TableCell>{p.schema ? <SchemaDisplay schema={p.schema as OpenAPIV3.SchemaObject} /> : 'N/A'}</TableCell>
                      <TableCell>{p.description || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {operation.requestBody && (
          <div className="mb-4">
            <h4 className="font-semibold text-md mb-2">Request Body</h4>
            <p className="text-xs text-muted-foreground mb-1">{(operation.requestBody as OpenAPIV3.RequestBodyObject).description}</p>
            {Object.entries((operation.requestBody as OpenAPIV3.RequestBodyObject).content).map(([contentType, mediaTypeObj]) => (
              <div key={contentType} className="mb-2">
                <Badge variant="outline" className="mb-1">{contentType}</Badge>
                {mediaTypeObj.schema && <SchemaDisplay schema={mediaTypeObj.schema as OpenAPIV3.SchemaObject}/>}
              </div>
            ))}
          </div>
        )}
        
        <h4 className="font-semibold text-md mb-2">Responses</h4>
        <Accordion type="multiple" className="w-full">
        {Object.entries(operation.responses).map(([statusCode, responseObj]) => {
          const res = responseObj as OpenAPIV3.ResponseObject;
          return (
            <AccordionItem value={statusCode} key={statusCode} className="border rounded-md mb-2 bg-secondary/20">
              <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                Status Code: <Badge variant={parseInt(statusCode) >= 400 ? "destructive" : "default"} className="ml-2">{statusCode}</Badge> 
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-xs">{res.description}</span>
              </AccordionTrigger>
              <AccordionContent className="px-3 py-2">
                {res.headers && (
                  <div className="mb-2">
                    <h5 className="text-xs font-semibold mb-1">Headers:</h5>
                     {Object.entries(res.headers).map(([headerName, headerObj]) => (
                       <div key={headerName} className="text-xs"><strong>{headerName}:</strong> {(headerObj as OpenAPIV3.HeaderObject).description}</div>
                     ))}
                  </div>
                )}
                {res.content && Object.entries(res.content).map(([contentType, mediaTypeObj]) => (
                  <div key={contentType} className="mb-1">
                    <Badge variant="outline" className="mb-1">{contentType}</Badge>
                    {mediaTypeObj.schema && <SchemaDisplay schema={mediaTypeObj.schema as OpenAPIV3.SchemaObject}/>}
                  </div>
                ))}
                 {!res.content && <p className="text-xs text-muted-foreground">No content defined for this response.</p>}
              </AccordionContent>
            </AccordionItem>
          )
        })}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
};

// Basic display for Swagger / OpenAPI V2
const OperationDetailsV2 = ({ path, method, operation }: { path: string, method: string, operation: OpenAPIV2.OperationObject }) => {
  const HttpIcon = ApiMethodIcons[method.toLowerCase()] || Icons.Network;
  return (
     <AccordionItem value={`${path}-${method}`} className="border-b-0">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 w-full">
          <Badge 
            variant="outline" 
            className={`w-20 justify-center text-xs font-semibold method-${method.toLowerCase()}`}
             style={{
              borderColor: `var(--method-${method.toLowerCase()}-border, hsl(var(--border)))`,
              backgroundColor: `var(--method-${method.toLowerCase()}-bg, hsl(var(--secondary)))`,
              color: `var(--method-${method.toLowerCase()}-fg, hsl(var(--secondary-foreground)))`,
            }}
          >
            <HttpIcon className="w-3 h-3 mr-1.5" />
            {method.toUpperCase()}
          </Badge>
          <span className="font-mono text-sm flex-grow text-left">{path}</span>
          <span className="text-xs text-muted-foreground truncate max-w-xs text-right">{operation.summary}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 bg-card rounded-b-md shadow-inner">
        {operation.description && <p className="text-sm text-muted-foreground mb-3">{operation.description}</p>}
        {operation.tags && operation.tags.length > 0 && (
          <div className="mb-3">
            {operation.tags.map(tag => <Badge key={tag} variant="secondary" className="mr-1">{tag}</Badge>)}
          </div>
        )}

        {operation.parameters && operation.parameters.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-md mb-2">Parameters</h4>
            <Table>
               <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>In</TableHead><TableHead>Required</TableHead><TableHead>Type</TableHead><TableHead>Schema/Details</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
              <TableBody>
                {operation.parameters.map((param, idx) => {
                  const p = param as OpenAPIV2.Parameter;
                  return (
                    <TableRow key={p.name + idx}>
                      <TableCell className="font-mono">{p.name}</TableCell>
                      <TableCell>{p.in}</TableCell>
                      <TableCell>{p.required ? <Icons.CheckCircle2 className="text-green-500 w-4 h-4"/> : <Icons.XCircle className="text-red-500 w-4 h-4"/>}</TableCell>
                      <TableCell>{p.type} {p.format ? `(${p.format})` : ''}</TableCell>
                       <TableCell>{p.schema ? <SchemaDisplay schema={p.schema as OpenAPIV2.SchemaObject} /> : (p.items ? <SchemaDisplay schema={p.items as OpenAPIV2.SchemaObject} name="items"/> : 'N/A')}</TableCell>
                      <TableCell>{p.description || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        <h4 className="font-semibold text-md mb-2">Responses</h4>
         <Accordion type="multiple" className="w-full">
        {Object.entries(operation.responses).map(([statusCode, responseObj]) => {
          const res = responseObj as OpenAPIV2.ResponseObject;
          return (
            <AccordionItem value={statusCode} key={statusCode} className="border rounded-md mb-2 bg-secondary/20">
              <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                Status Code: <Badge variant={parseInt(statusCode) >= 400 ? "destructive" : "default"} className="ml-2">{statusCode}</Badge>
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-xs">{res.description}</span>
              </AccordionTrigger>
              <AccordionContent className="px-3 py-2">
                {res.schema && <SchemaDisplay schema={res.schema} />}
                {!res.schema && <p className="text-xs text-muted-foreground">No schema defined for this response.</p>}
              </AccordionContent>
            </AccordionItem>
          )
        })}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  )
};


export function InteractiveDocViewer() {
  const { spec, fileName, error: specError, rawSpec } = useOpenApiStore();

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
            Please import an OpenAPI specification first using the <a href="/" className="underline text-primary hover:text-primary/80">Import page</a> to view the documentation.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { info, paths } = spec;
  const isV3 = isOpenAPIV3(spec);
  const isV2 = isOpenAPIV2(spec);
  
  const methodColorsCSS = `
    <style>
      .method-get { --method-get-bg: hsl(var(--chart-1)); --method-get-fg: hsl(var(--primary-foreground)); --method-get-border: hsl(var(--chart-1)); }
      .method-post { --method-post-bg: hsl(var(--chart-2)); --method-post-fg: hsl(var(--primary-foreground)); --method-post-border: hsl(var(--chart-2)); }
      .method-put { --method-put-bg: hsl(var(--chart-3)); --method-put-fg: hsl(var(--primary-foreground)); --method-put-border: hsl(var(--chart-3)); }
      .method-delete { --method-delete-bg: hsl(var(--destructive)); --method-delete-fg: hsl(var(--destructive-foreground)); --method-delete-border: hsl(var(--destructive)); }
      .method-patch { --method-patch-bg: hsl(var(--chart-4)); --method-patch-fg: hsl(var(--primary-foreground)); --method-patch-border: hsl(var(--chart-4)); }
      .method-options { --method-options-bg: hsl(var(--muted)); --method-options-fg: hsl(var(--muted-foreground)); --method-options-border: hsl(var(--muted)); }
      .method-head { --method-head-bg: hsl(var(--muted)); --method-head-fg: hsl(var(--muted-foreground)); --method-head-border: hsl(var(--muted)); }
      .method-trace { --method-trace-bg: hsl(var(--muted)); --method-trace-fg: hsl(var(--muted-foreground)); --method-trace-border: hsl(var(--muted)); }
      .text-xxs { font-size: 0.65rem; line-height: 0.85rem; }
    </style>
  `;


  return (
    <div className="space-y-6">
      <div dangerouslySetInnerHTML={{ __html: methodColorsCSS }} />
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-background">
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
             <Icons.BookOpen className="w-8 h-8" /> {info.title} <Badge variant="outline" className="text-sm">{info.version}</Badge>
          </CardTitle>
          {info.description && <CardDescription className="text-md pt-1">{info.description}</CardDescription>}
          {isV3 && (spec as OpenAPIV3.Document).externalDocs && (
             <a href={(spec as OpenAPIV3.Document).externalDocs!.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1">
                <Icons.ExternalLink className="w-3 h-3"/> External Documentation
            </a>
          )}
           {isV2 && (spec as OpenAPIV2.Document).host && <p className="text-sm text-muted-foreground">Host: {(spec as OpenAPIV2.Document).host}</p>}
           {isV2 && (spec as OpenAPIV2.Document).basePath && <p className="text-sm text-muted-foreground">Base Path: {(spec as OpenAPIV2.Document).basePath}</p>}
        </CardHeader>
        {info.contact && (
        <CardContent className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Contact</h3>
            {info.contact.name && <p className="text-xs">Name: {info.contact.name}</p>}
            {info.contact.url && <p className="text-xs">URL: <a href={info.contact.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{info.contact.url}</a></p>}
            {info.contact.email && <p className="text-xs">Email: <a href={`mailto:${info.contact.email}`} className="text-accent hover:underline">{info.contact.email}</a></p>}
        </CardContent>
        )}
        {info.license && (
        <CardContent className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">License</h3>
            <p className="text-xs">{info.license.name}
            {info.license.url && <span> (<a href={info.license.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Details</a>)</span>}
            </p>
        </CardContent>
        )}
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Icons.Network /> API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {paths && Object.keys(paths).length > 0 ? (
             <Accordion type="multiple" className="w-full space-y-2">
              {Object.entries(paths).map(([path, pathItem]) => 
                pathItem && Object.entries(pathItem).map(([method, operation]) => {
                  // Filter out non-HTTP methods like 'parameters', 'summary', etc.
                  if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method.toLowerCase())) {
                    return null;
                  }
                  if (isV3) {
                    return <OperationDetailsV3 key={`${path}-${method}`} path={path} method={method} operation={operation as OpenAPIV3.OperationObject} />;
                  } else if (isV2) {
                    return <OperationDetailsV2 key={`${path}-${method}`} path={path} method={method} operation={operation as OpenAPIV2.OperationObject} />;
                  }
                  return null;
                }).filter(Boolean)
              )}
            </Accordion>
          ) : (
            <p className="text-muted-foreground">No paths defined in this specification.</p>
          )}
        </CardContent>
      </Card>
      
      {isV3 && (spec as OpenAPIV3.Document).components?.schemas && Object.keys((spec as OpenAPIV3.Document).components!.schemas!).length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2"><Icons.FileJson /> Schemas</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries((spec as OpenAPIV3.Document).components!.schemas!).map(([schemaName, schemaObj]) => (
                <AccordionItem value={schemaName} key={schemaName}>
                  <AccordionTrigger>{schemaName}</AccordionTrigger>
                  <AccordionContent>
                    <SchemaDisplay schema={schemaObj as OpenAPIV3.SchemaObject} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
       {isV2 && (spec as OpenAPIV2.Document).definitions && Object.keys((spec as OpenAPIV2.Document).definitions!).length > 0 &&(
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2"><Icons.FileJson /> Definitions (Swagger 2.0)</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries((spec as OpenAPIV2.Document).definitions!).map(([defName, defObj]) => (
                <AccordionItem value={defName} key={defName}>
                  <AccordionTrigger>{defName}</AccordionTrigger>
                  <AccordionContent>
                    <SchemaDisplay schema={defObj as OpenAPIV2.SchemaObject} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Raw Specification</CardTitle>
            <CardDescription>The loaded OpenAPI specification in YAML format. ({fileName})</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50">
              <pre className="text-xs">{rawSpec || "No raw specification data available."}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
    </div>
  );
}

