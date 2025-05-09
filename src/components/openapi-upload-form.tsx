
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
import { saveOpenApiSpec, type OpenApiSpec as LocalOpenApiSpec } from '@/actions/openapi-actions';


const formSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    url: z.string().url({ message: "Please enter a valid URL." }),
  }),
  z.object({
    type: z.literal("file"),
    // Validate FileList only on the client-side
    file: z.custom<FileList>((val) => typeof window !== 'undefined' ? val instanceof FileList : true, "Invalid file input.")
      .refine((val) => typeof window !== 'undefined' ? val?.length === 1 : true, "Please upload exactly one file.")
      .refine((val) => typeof window !== 'undefined' ? val?.[0] instanceof File : true, "Uploaded item must be a file."),
  }),
]);

type FormValues = z.infer<typeof formSchema>;

export function OpenApiUploadForm({ onSpecLoaded }: { onSpecLoaded?: (specId: string) => void }) {
  const { setSpec, setError, setLoading, isLoading, fileName: currentFileName, activeSpecId } = useOpenApiStore();
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

        if (!response.ok) { // The /api/fetch-spec call itself failed or indicated an error
          const responseBodyAsText = await response.text(); // Read body ONCE as text
          let errorMessage = `Error fetching spec via proxy: ${response.status} ${response.statusText}`; // Default
          try {
            // Try to parse the text as JSON to get a structured error from /api/fetch-spec
            const errorJson = JSON.parse(responseBodyAsText);
            if (errorJson && errorJson.error) {
              errorMessage = errorJson.error; // Use the specific error message from /api/fetch-spec
            } else {
              // It was JSON, but not the expected { error: "..." } format
              errorMessage = `Proxy error (${response.status}): ${responseBodyAsText.substring(0, 200)}...`;
            }
          } catch (e) {
            // Parsing as JSON failed, means the error response from /api/fetch-spec was likely HTML or plain text
            errorMessage = `Proxy error (${response.status}): ${responseBodyAsText.substring(0, 200)}...`;
          }
          throw new Error(errorMessage);
        }
        
        // If response.ok, /api/fetch-spec call was successful (HTTP 2xx)
        // The body should contain { specObject, rawSpecText } or { error } if target fetch failed but proxy is ok
        const result = await response.json(); 
        
        if (result.error) { 
            // This means /api/fetch-spec successfully processed the request to the proxy
            // but the operation within /api/fetch-spec (e.g., fetching from target URL, parsing spec) encountered an error.
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
        } else {
          parsedContent = JSON.parse(rawSpecText);
        }
        
        const specToBundle = JSON.parse(JSON.stringify(parsedContent));
        specObject = (await SwaggerParser.bundle(specToBundle)) as OpenAPI.Document; 
        rawSpecText = YAML.dump(specObject);
      }

      const savedSpec = await saveOpenApiSpec(inputFileName, JSON.stringify(specObject), rawSpecText);
      
      setSpec({
        specObject,
        rawSpecText,
        name: savedSpec.name,
        id: savedSpec.id,
      });

      toast({
        title: "Success",
        description: `OpenAPI spec "${savedSpec.name}" loaded, validated, and saved.`,
        variant: "default",
      });
      
      if (onSpecLoaded) {
        onSpecLoaded(savedSpec.id);
      }
      form.reset({type: data.type, url: data.type === 'url' ? "" : undefined, file: undefined});

    } catch (err: any) {
      console.error("Error processing OpenAPI spec:", err);
      const errorMessage = err.message || "Failed to parse, validate, or save OpenAPI specification.";
      setError(errorMessage); // Update store error
      toast({
        title: "Error Processing Specification",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icons.UploadCloud className="w-6 h-6 text-primary" />
          Import OpenAPI Specification
        </CardTitle>
        <CardDescription>
          Upload a file or provide a URL. Imported specs will be saved locally in your browser.
          {currentFileName && (
             <span className="block mt-2 text-sm text-muted-foreground">
                Currently active: <strong className="text-foreground">{currentFileName}</strong> {activeSpecId ? `(ID: ${activeSpecId.substring(0,8)}...)` : ''}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url" className="w-full" onValueChange={(value) => {
          form.setValue("type", value as "url" | "file");
          if (value === 'url') {
            form.setValue('file', undefined as any); 
            form.resetField('file'); // Reset file input validation state
          } else {
            form.setValue('url', '');
             form.resetField('url'); // Reset URL input validation state
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
                        <Input placeholder="https://petstore3.swagger.io/api/v3/openapi.json" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the public URL of your OpenAPI specification file.
                      </FormDescription>
                      <FormMessage />
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
