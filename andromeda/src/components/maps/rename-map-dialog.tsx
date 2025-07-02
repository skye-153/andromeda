'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface RenameMapDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRename: (newName: string) => Promise<void>;
  map: { id: string; name: string } | null;
}

export function RenameMapDialog({ isOpen, onOpenChange, onRename, map }: RenameMapDialogProps) {
  const [name, setName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (map && isOpen) {
      setName(map.name);
    }
  }, [map, isOpen]);

  const handleRename = async () => {
    if (name.trim() && !isRenaming && map) {
      setIsRenaming(true);
      await onRename(name.trim());
      // The parent component will handle closing the dialog and resetting state
      setIsRenaming(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Map</DialogTitle>
          <DialogDescription>
            Enter a new name for your map "{map?.name}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                autoComplete="off"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isRenaming || !name.trim() || name.trim() === map?.name}>
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRenaming ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
