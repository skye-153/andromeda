'use client';

import React, { useState, useEffect } from 'react';
import { MoreVertical, Plus, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateMapDialog } from '@/components/maps/create-map-dialog';
import { getMaps, createMap, deleteMap, renameMap } from '@/services/map-service';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { RenameMapDialog } from '@/components/maps/rename-map-dialog';

interface Map {
  id: string;
  name: string;
}

export default function MapsPage() {
  const [maps, setMaps] = useState<Map[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<Map | null>(null);
  const [isRenameDialogOpen, setRenameDialogOpen] = useState(false);
  const [mapToRename, setMapToRename] = useState<Map | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    getMaps().then((fetchedMaps) => {
      setMaps(fetchedMaps);
      setIsLoading(false);
    });
  }, []);

  const handleCreateMap = async (name: string) => {
    try {
      const newMap = await createMap(name);
      router.push(`/maps/${newMap.id}?name=${encodeURIComponent(newMap.name)}`);
    } catch (error) {
      toast({
        title: 'Error creating map',
        description: 'Could not create a new map. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMap = async () => {
    if (!mapToDelete) return;

    try {
      await deleteMap(mapToDelete.id);
      setMaps((prevMaps) => prevMaps.filter((map) => map.id !== mapToDelete.id));
      toast({ title: 'Map Deleted', description: `"${mapToDelete.name}" has been deleted.` });
    } catch (error) {
      toast({
        title: 'Error deleting map',
        description: 'Could not delete the map. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMapToDelete(null);
    }
  };

  const handleRenameMap = async (newName: string) => {
    if (!mapToRename) return;
    try {
      const updatedMap = await renameMap(mapToRename.id, newName);
      if (updatedMap) {
        setMaps(prevMaps =>
          prevMaps.map(map => (map.id === updatedMap.id ? { id: updatedMap.id, name: updatedMap.name } : map))
        );
        toast({ title: 'Map Renamed', description: `Your map is now called "${newName}".` });
      } else {
        throw new Error('Map not found');
      }
    } catch (error) {
      toast({
        title: 'Error renaming map',
        description: 'Could not rename the map. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMapToRename(null);
      setRenameDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Maps</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Map
        </Button>
      </div>

      <CreateMapDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateMap}
      />
      
      <RenameMapDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onRename={handleRenameMap}
        map={mapToRename}
      />

      <AlertDialog open={!!mapToDelete} onOpenChange={() => setMapToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this map?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{mapToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMap}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {maps.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          <h3 className="text-xl font-semibold mt-4">No maps yet</h3>
          <p className="text-muted-foreground mt-2">Click "Create Map" to start your first creation.</p>
          <Button onClick={() => setCreateDialogOpen(true)} className="mt-6">
            <Plus className="mr-2 h-4 w-4" /> Create Map
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <Card key={map.id} className="hover:border-accent transition-colors h-full flex flex-col relative">
              <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setMapToRename(map);
                        setRenameDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setMapToDelete(map);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Link
                href={`/maps/${map.id}?name=${encodeURIComponent(map.name)}`}
                className="block h-full flex-grow"
              >
                <div className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>{map.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">Click to open editor</p>
                  </CardContent>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
