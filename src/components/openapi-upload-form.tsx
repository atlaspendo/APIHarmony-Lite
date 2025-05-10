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
// Removed local storage based actions
// import { saveOpenApiSpec, type OpenApiSpec as LocalOpenApiSpec } from '@/actions/openapi-actions';


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
    let responseBodyText: string | undefined;

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
        
        responseBodyText = await response.text(); 

        if (!response.ok) {
          let errorMsgFromServer = `Error fetching spec via proxy: ${response.status} ${response.statusText}`; // Default
          
          try {
            const errorJson = JSON.parse(responseBodyText);
            if (errorJson && errorJson.error) {
              errorMsgFromServer = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
            } else if (errorJson && errorJson.message) {
               errorMsgFromServer = typeof errorJson.message === 'string' ? errorJson.message : JSON.stringify(errorJson.message);
            } else {
              if (responseBodyText.trim().startsWith('<')) {
                 errorMsgFromServer = `Failed to fetch spec. External server at ${data.url} returned an HTML page (status ${response.status} ${response.statusText}). This could be an error page or authentication prompt.`;
              } else if (responseBodyText) {
                errorMsgFromServer = `Non-JSON error from server (${response.status}): ${responseBodyText.substring(0, 200)}...`;
              }
            }
          } catch (e) {
             if (responseBodyText.trim().startsWith('<')) {
                errorMsgFromServer = `Failed to fetch spec. External server at ${data.url} returned an HTML page (status ${response.status} ${response.statusText}) and it's not valid JSON.`;
             } else if (responseBodyText) {
               errorMsgFromServer = `Failed to fetch spec. External server returned unexpected non-JSON, non-HTML content for status ${response.status}. Preview (first 100 chars): ${responseBodyText.substring(0, 100)}...`;
             }
          }
          
          throw new Error(errorMsgFromServer); // This was line 93
        }
        // If response.ok is true
        const result = JSON.parse(responseBodyText); // This is fine, first read for success path
        
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
        } else {
          parsedContent = JSON.parse(rawSpecText);
        }
        
        const specToBundle = JSON.parse(JSON.stringify(parsedContent));
        specObject = (await SwaggerParser.bundle(specToBundle)) as OpenAPI.Document; 
        rawSpecText = YAML.dump(specObject);
      }
      
      // Not saving to localStorage/DB anymore. Just setting to store.
      // const savedSpec = await saveOpenApiSpec(inputFileName, JSON.stringify(specObject), rawSpecText);
      
      setSpec({
        specObject,
        rawSpecText,
        name: inputFileName, // Use inputFileName as it's not from DB
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

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icons.UploadCloud className="w-6 h-6 text-primary" />
          Import OpenAPI Specification
        </CardTitle>
        <CardDescription>
          Upload a file or provide a URL. The imported spec will be active for the current session.
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
