
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import SwaggerParser from "@apidevtools/swagger-parser";
import YAML from 'js-yaml';
import type { OpenAPI } from 'openapi-types';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOpenApiStore } from "@/stores/openapi-store";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    url: z.string().url({ message: "Please enter a valid URL." }),
  }),
  z.object({
    type: z.literal("file"),
    file: z.custom<FileList>((val) => typeof window !== 'undefined' ? val instanceof FileList : true, "Invalid file input.")
      .refine((val) => typeof window !== 'undefined' ? val?.length === 1 : true, "Please upload exactly one file.")
      .refine((val) => typeof window !== 'undefined' ? val?.[0] instanceof File : true, "Uploaded item must be a file."),
  }),
]);

type FormValues = z.infer<typeof formSchema>;

export function OpenApiUploadForm({ onSpecLoaded }: { onSpecLoaded?: (name: string) => void }) {
  const { setSpec, setError, setLoading, isLoading, fileName: currentFileName } =
    useOpenApiStore();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "url", url: "" },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    setError(null);
    let specObject: OpenAPI.Document;
    let rawSpecText: string;
    let inputFileName: string;

    if (typeof window === 'undefined' && data.type === 'file') {
      setError("File upload can only be performed in the browser.");
      setLoading(false);
      toast({title: "Error", description: "Cannot process file uploads on the server.", variant: "destructive"});
      return;
    }

    try {
      if (data.type === "url") {
        const response = await fetch('/api/fetch-spec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: data.url }),
        });
        
        const responseBodyText = await response.text(); 

        if (!response.ok) {
          let descriptiveError = `Failed to fetch from URL ${data.url}: ${response.status} ${response.statusText}`; // Default
          try {
            const errorResult = JSON.parse(responseBodyText); // responseBodyText is from our /api/fetch-spec
            if (errorResult && typeof errorResult.error === 'string') {
              descriptiveError = errorResult.error; // Use the specific error message from our API
            } else {
               // Our /api/fetch-spec returned ok:false but not the expected { error: "..." } JSON structure.
              descriptiveError = `Proxy API returned an unexpected error structure (Status: ${response.status}). Raw: ${responseBodyText.substring(0,150)}...`;
            }
          } catch (parseError) {
            // This means our /api/fetch-spec endpoint returned a non-JSON error response.
             console.error("Proxy API returned non-JSON error:", responseBodyText);
            descriptiveError = `Proxy API returned an invalid error format (Status: ${response.status}). Raw: ${responseBodyText.substring(0,150)}...`;
          }
          throw new Error(descriptiveError);
        }
        
        // If response.ok, parse the already read responseBodyText
        const result = JSON.parse(responseBodyText); 
        
        if (result.error) { 
            throw new Error(result.error);
        }
        
        specObject = result.specObject as OpenAPI.Document;
        rawSpecText = result.rawSpecText;
        inputFileName = data.url.substring(data.url.lastIndexOf('/') + 1) || "openapi-spec-from-url";

      } else { // type === "file"
        const file = data.file![0]; 
        inputFileName = file.name;
        rawSpecText = await file.text();
        
        let parsedContent;
        if (inputFileName.endsWith(".yaml") || inputFileName.endsWith(".yml")) {
          parsedContent = YAML.load(rawSpecText);
        } else { // Assume JSON for .json or other extensions
          parsedContent = JSON.parse(rawSpecText);
        }
        
        // SwaggerParser.bundle can also dereference, which is good.
        // Ensure parsedContent is a plain JS object for SwaggerParser
        const specToBundle = JSON.parse(JSON.stringify(parsedContent));
        specObject = (await SwaggerParser.bundle(specToBundle)) as OpenAPI.Document; 
        // Ensure rawSpecText is YAML for consistent storage/display if desired, or keep original rawSpecText
        rawSpecText = YAML.dump(specObject); // Convert bundled/validated spec back to YAML
      }
      
      setSpec({
        specObject,
        rawSpecText,
        name: inputFileName,
        id: `temp-${Date.now()}`, // Temporary ID as it's not persisted
      });

      toast({
        title: "Success",
        description: `OpenAPI spec "${inputFileName}" loaded and validated.`,
        variant: "default",
      });
      
      if (onSpecLoaded) {
        onSpecLoaded(inputFileName);
      }
      form.reset({type: data.type, url: data.type === 'url' ? "" : undefined, file: undefined});

    } catch (err: any) {
      console.error("Error processing OpenAPI spec:", err);
      const errorMessage = err.message || "Failed to parse or validate OpenAPI specification.";
      setError(errorMessage); 
      toast({
        title: "Error Processing Specification",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  const exampleSpecs = [
    {name: "Swagger Petstore (v2 JSON)", url: "https://petstore.swagger.io/v2/swagger.json"},
    {name: "OpenAPI Petstore (v3 YAML)", url: "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml"},
    // Gitea might require auth or have CORS, so it's less reliable for a quick demo fetch via simple proxy.
    // {name: "Gitea API (v1 JSON)", url: "https://try.gitea.io/swagger.v1.json"}, 
    {name: "Public APIs (YAML)", url: "https://api.apis.guru/v2/specs/apis.guru/2.2.0/openapi.yaml"}
  ];


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icons.UploadCloud className="w-6 h-6 text-primary" />
          Import OpenAPI Specification
        </CardTitle>
        <CardDescription>
          Upload a file (JSON/YAML) or provide a URL. The imported spec will be active for the current session.
          {currentFileName && (
             <span className="block mt-2 text-sm text-muted-foreground">
                Currently active: <strong className="text-foreground">{currentFileName}</strong>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url" className="w-full" onValueChange={(value) => {
          form.setValue("type", value as "url" | "file");
          if (value === 'url') {
            form.setValue('file', undefined as any); 
            form.resetField('file'); 
          } else {
            form.setValue('url', '');
             form.resetField('url'); 
          }
          form.clearErrors(); 
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url"><Icons.Globe className="w-4 h-4 mr-2" />From URL</TabsTrigger>
            <TabsTrigger value="file"><Icons.FileJson className="w-4 h-4 mr-2" />Upload File</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <TabsContent value="url">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specification URL</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., https://petstore3.swagger.io/api/v3/openapi.json" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the public URL of your OpenAPI specification file (JSON or YAML).
                      </FormDescription>
                      <FormMessage />
                       <div className="mt-3 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1.5">Or try an example:</p>
                            <div className="flex flex-wrap gap-2">
                                {exampleSpecs.map(spec => (
                                    <Button 
                                        key={spec.url} 
                                        type="button" // Prevents form submission
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs"
                                        onClick={() => {
                                          form.setValue("url", spec.url);
                                          form.clearErrors("url"); // Clear error if any
                                        }}
                                    >
                                        {spec.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="file">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, onBlur, name, ref } }) => ( 
                    <FormItem>
                      <FormLabel>Specification File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".json,.yaml,.yml"
                           onChange={(e) => onChange(e.target.files)} 
                          onBlur={onBlur}
                          name={name}
                          ref={ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload a .json, .yaml, or .yml file from your computer.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.UploadCloud className="mr-2 h-4 w-4" />
                )}
                Load Specification
              </Button>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
