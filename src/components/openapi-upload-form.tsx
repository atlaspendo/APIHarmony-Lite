
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
import { saveOpenApiSpec } from "@/actions/openapi-actions"; // Still using this action, but it's refactored

const formSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    url: z.string().url({ message: "Please enter a valid URL." }),
  }),
  z.object({
    type: z.literal("file"),
    file: z.custom<FileList>((val) => typeof window !== 'undefined' ? val instanceof FileList : true, "Invalid file input.")
      .refine((val) => val?.length === 1, "Please upload exactly one file.")
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

    if (typeof window === 'undefined') {
      setError("This operation can only be performed in the browser.");
      setLoading(false);
      toast({title: "Error", description: "Cannot process specs on the server for this demo.", variant: "destructive"});
      return;
    }

    try {
      if (data.type === "url") {
        const response = await fetch('/api/fetch-spec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: data.url }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch spec from URL: ${response.statusText}`);
        }
        const result = await response.json();
        specObject = result.specObject as OpenAPI.Document;
        rawSpecText = result.rawSpecText;
        inputFileName = data.url.substring(data.url.lastIndexOf('/') + 1) || "openapi-spec-from-url";
      } else {
        const file = data.file[0];
        inputFileName = file.name;
        rawSpecText = await file.text();
        
        let parsedContent;
        if (inputFileName.endsWith(".yaml") || inputFileName.endsWith(".yml")) {
          parsedContent = YAML.load(rawSpecText);
        } else {
          parsedContent = JSON.parse(rawSpecText);
        }
        specObject = (await SwaggerParser.bundle(JSON.parse(JSON.stringify(parsedContent)))) as OpenAPI.Document; 
        rawSpecText = YAML.dump(specObject); 
      }

      // Save to localStorage via action
      const savedSpec = await saveOpenApiSpec(inputFileName, JSON.stringify(specObject), rawSpecText);
      
      setSpec({
        specObject,
        rawSpecText,
        name: savedSpec.name,
        id: savedSpec.id,
      });

      toast({
        title: "Success",
        description: `OpenAPI spec "${savedSpec.name}" loaded, validated, and saved to browser storage.`,
        variant: "default",
      });
      
      if (onSpecLoaded) {
        onSpecLoaded(savedSpec.id);
      }
      form.reset();

    } catch (err: any) {
      console.error("Error processing OpenAPI spec:", err);
      let errorMessage = "Failed to parse, validate, or save OpenAPI specification.";
      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      toast({
        title: "Error",
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
          Upload a file or provide a URL. Imported specs will be saved to your browser's local storage.
          {currentFileName && (
             <span className="block mt-2 text-sm text-muted-foreground">
                Currently active: <strong className="text-foreground">{currentFileName}</strong> {activeSpecId ? `(ID: ${activeSpecId.substring(0,8)}...)` : ''}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url" className="w-full" onValueChange={(value) => form.setValue("type", value as "url" | "file")}>
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
                        <Input placeholder="https://example.com/api/openapi.json" {...field} />
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
                  render={({ field }) => ( 
                    <FormItem>
                      <FormLabel>Specification File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".json,.yaml,.yml"
                          onChange={(e) => field.onChange(e.target.files)}
                          ref={field.ref} 
                          name={field.name} 
                          onBlur={field.onBlur} 
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
                Load & Save Specification
              </Button>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
