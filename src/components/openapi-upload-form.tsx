
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
    file: z.any()
      .refine((value): value is FileList => {
        if (typeof window === 'undefined') {
          // Always pass server-side validation for this check,
          // as FileList is a browser-specific API.
          return true;
        }
        return value instanceof FileList;
      }, {
        message: "Invalid file input. Expected a FileList.",
      })
      .refine((value) => {
        if (typeof window === 'undefined') {
          return true;
        }
        // This check assumes value is FileList due to previous refinement on client
        return value?.length === 1;
      }, {
        message: "Please upload exactly one file.",
      })
      .refine((value) => {
         if (typeof window === 'undefined') {
          return true;
        }
        // This check assumes value is FileList and has one item
        return value?.[0] instanceof File;
      }, {
        message: "The uploaded item must be a valid file.",
      }),
  }),
]);

type FormValues = z.infer<typeof formSchema>;

export function OpenApiUploadForm() {
  const { setSpec, setError, setLoading, isLoading, fileName: currentFileName } = useOpenApiStore();
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
    let fileName: string;

    try {
      if (data.type === "url") {
        specObject = (await SwaggerParser.bundle(data.url)) as OpenAPI.Document; // bundle also validates and dereferences
        rawSpecText = YAML.dump(specObject);
        fileName = data.url.substring(data.url.lastIndexOf('/') + 1) || "openapi-spec-from-url";
      } else {
        // At this point, client-side Zod validation has ensured data.file is a FileList with one File.
        const file = data.file[0];
        fileName = file.name;
        rawSpecText = await file.text();
        
        let parsedContent;
        if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
          parsedContent = YAML.load(rawSpecText);
        } else {
          parsedContent = JSON.parse(rawSpecText);
        }
        // Validate and dereference the parsed content
        specObject = (await SwaggerParser.validate(JSON.parse(JSON.stringify(parsedContent)))) as OpenAPI.Document; 
        // SwaggerParser.validate works best with plain JS objects, hence stringify/parse.
        // To ensure rawSpecText is aligned with what SwaggerParser processed if it modifies it during validation/bundling, re-dump:
        rawSpecText = YAML.dump(specObject);
      }

      setSpec(specObject, rawSpecText, fileName);
      toast({
        title: "Success",
        description: `OpenAPI spec "${fileName}" loaded and validated.`,
        variant: "default",
      });
    } catch (err: any) {
      console.error("Error parsing OpenAPI spec:", err);
      let errorMessage = "Failed to parse or validate OpenAPI specification.";
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
          Upload a file or provide a URL to an OpenAPI (v2 or v3) specification.
          {currentFileName && (
             <span className="block mt-2 text-sm text-muted-foreground">
                Currently loaded: <strong className="text-foreground">{currentFileName}</strong>
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
                  render={({ field }) => ( // field.onChange will receive FileList from input
                    <FormItem>
                      <FormLabel>Specification File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".json,.yaml,.yml"
                          // react-hook-form's onChange expects the event or FileList
                          onChange={(e) => field.onChange(e.target.files)}
                          ref={field.ref} // Ensure ref is passed for RHF to manage the input
                          name={field.name} // Ensure name is passed
                          onBlur={field.onBlur} // Ensure onBlur is passed
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

