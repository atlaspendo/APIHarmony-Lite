
"use client";

import { useEffect, useState } from 'react';
import { OpenApiUploadForm } from "@/components/openapi-upload-form";
import { useOpenApiStore } from '@/stores/openapi-store';
// Removed imports related to listing/deleting specs as the UI for it is being removed.
// import { getOpenApiSpecs, getOpenApiSpecById, deleteOpenApiSpec, type OpenApiSpec } from '@/actions/openapi-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
// SwaggerParser and OpenAPI types are still needed for parsing/validation logic if OpenApiUploadForm keeps it.
// import SwaggerParser from "@apidevtools/swagger-parser"; 
import type { OpenAPI } from 'openapi-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ImportOpenApiPage() {
  // Removed state and effects related to displaying saved specs as per user request to remove the section.
  // const { setSpec, setLoading, setError: setStoreError, clear: clearActiveSpec } = useOpenApiStore();
  // const [savedSpecs, setSavedSpecs] = useState<OpenApiSpec[]>([]); 
  // const [isLoadingList, setIsLoadingList] = useState(true);
  // const [listError, setListError] = useState<string | null>(null);
  // const { toast } = useToast();

  // const fetchSpecs = async () => {
  //   setIsLoadingList(true);
  //   setListError(null);
  //   if (typeof window !== 'undefined') { 
  //     try {
  //       const specs = await getOpenApiSpecs();
  //       setSavedSpecs(specs);
  //     } catch (error: any) {
  //       console.error("Failed to fetch saved specs:", error);
  //       setListError(error.message || "Could not load saved specifications.");
  //       toast({ title: "Error Loading Specs", description: error.message, variant: "destructive" });
  //     } finally {
  //       setIsLoadingList(false);
  //     }
  //   } else {
  //     setIsLoadingList(false); 
  //   }
  // };

  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     fetchSpecs();
  //   }
  // }, []);

  // const handleLoadSpec = async (specId: string) => {
  //   setLoading(true);
  //   if (typeof window !== 'undefined') {
  //     try {
  //       const dbSpec = await getOpenApiSpecById(specId);
  //       if (dbSpec) {
  //         const specObject = JSON.parse(dbSpec.content) as OpenAPI.Document;

  //         setSpec({
  //           specObject,
  //           rawSpecText: dbSpec.rawContent,
  //           name: dbSpec.name,
  //           id: dbSpec.id,
  //         });
  //         toast({ title: "Specification Loaded", description: `Activated "${dbSpec.name}".` });
  //       } else {
  //         throw new Error("Specification not found.");
  //       }
  //     } catch (error: any) {
  //       console.error("Failed to load spec:", error);
  //       setStoreError(error.message || "Could not load the selected specification.");
  //       toast({ title: "Error Loading Spec", description: error.message, variant: "destructive" });
  //     } finally {
  //       setLoading(false);
  //     }
  //   } else {
  //     setLoading(false);
  //     toast({ title: "Error", description: "Cannot load specs on the server.", variant: "destructive"});
  //   }
  // };
  
  // const handleDeleteSpec = async (specId: string) => {
  //   if (typeof window !== 'undefined') {
  //     try {
  //       await deleteOpenApiSpec(specId);
  //       toast({ title: "Specification Deleted", description: `Successfully deleted the specification.` });
  //       fetchSpecs(); 
  //       if (useOpenApiStore.getState().activeSpecId === specId) {
  //         clearActiveSpec();
  //       }
  //     } catch (error: any) {
  //       console.error("Failed to delete spec:", error);
  //       toast({ title: "Error Deleting Spec", description: error.message, variant: "destructive" });
  //     }
  //   } else {
  //      toast({ title: "Error", description: "Cannot delete specs on the server.", variant: "destructive"});
  //   }
  // };


  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* The onSpecLoaded prop is removed as fetchSpecs is removed */}
      <OpenApiUploadForm /> 

      {/* The "Saved API Specifications" card is removed as per the user's request. */}
      {/* 
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Icons.ListChecks className="w-5 h-5 text-primary" /> Saved API Specifications
          </CardTitle>
          <CardDescription>
            Manage and load your previously imported API specifications (stored in browser).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingList && (
            <div className="flex items-center justify-center py-6">
              <Icons.Loader className="w-6 h-6 animate-spin text-primary mr-2" />
              <span>Loading specifications...</span>
            </div>
          )}
          {listError && (
            <p className="text-destructive text-center py-6">{listError}</p>
          )}
          {!isLoadingList && !listError && savedSpecs.length === 0 && (
            <p className="text-muted-foreground text-center py-6">No specifications saved yet. Use the form above to import one.</p>
          )}
          {!isLoadingList && !listError && savedSpecs.length > 0 && (
            <ScrollArea className="h-[300px] pr-3">
              <ul className="space-y-2">
                {savedSpecs.map((spec) => (
                  <li key={spec.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{spec.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {formatDistanceToNow(new Date(spec.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleLoadSpec(spec.id)}>
                        <Icons.PlayCircle className="w-4 h-4 mr-2" /> Load
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm">
                            <Icons.Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the API specification named "{spec.name}" from your browser's local storage.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSpec(spec.id)}>
                              Yes, delete it
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      */}
    </div>
  );
}

