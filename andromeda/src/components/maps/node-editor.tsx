// src/components/maps/node-editor.tsx

// TODO: Integrate REST API calls for all data operations when running in browser/Next.js. Do not change any UI or styling.

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, X, Link as LinkIcon, File as FileIcon } from 'lucide-react';
import { type NodeData, type FileData } from '@/lib/types'; // Import types
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
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';

// Declare 'electron' to avoid TypeScript errors if you're using TypeScript
declare global {
  interface Window {
    electron: any;
  }
}


interface NodeEditorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  node: NodeData;
  onUpdate: (updatedNode: NodeData) => void;
  onDelete: () => void; // onDelete no longer needs node ID as it's handled in MapCanvas
}

const NodeEditor: React.FC<NodeEditorProps> = ({ isOpen, onOpenChange, node, onUpdate, onDelete }) => {
  const [editedNode, setEditedNode] = useState<NodeData>(node);
  // The attachedFiles state should directly reflect the files in editedNode
  // When node prop changes, update editedNode, and attachedFiles will update with it
  const attachedFiles = editedNode.files;

  // Update state when the node prop changes
  useEffect(() => {
    setEditedNode(node);
  }, [node]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedNode(prev => ({ ...prev, title: e.target.value }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedNode(prev => ({ ...prev, description: e.target.value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setEditedNode(prev => ({ ...prev, isDone: checked }));
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: FileData[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Read file content to send to backend for saving
        const fileContent = await file.arrayBuffer();

        newFiles.push({
          id: crypto.randomUUID(), // Give new files a temporary frontend ID
          name: file.name,
          data: Buffer.from(fileContent), // Convert ArrayBuffer to Buffer for sending via IPC
        });
      }
      // Add new files to the editedNode's files array
      setEditedNode(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  }, []); // Empty dependency array

  const handleSave = () => {
    // The editedNode state already contains the updated files array with new files having data
    onUpdate(editedNode); // Call the parent's update function with the edited node
  };

  const handleDelete = () => {
    // Trigger the delete action in the parent component
    onDelete();
  };

  const handleFileClick = (filePath?: string) => {
    if (filePath) {
      if (typeof window !== 'undefined' && window.electron) {
        window.electron.ipcRenderer.send('open-local-file', filePath);
      } else {
        // TODO: Replace with REST API call or browser file open logic when not in Electron
        console.error('Electron IPC not available. Use REST API or browser logic here.');
      }
    } else {
      console.warn("File path is not available for this file yet.");
      // This might happen for newly added files that haven't been saved yet
    }
  };

  const handleRemoveFile = (fileId?: string, fileTemporaryId?: string) => {
    // Remove the file from the editedNode's files array
    setEditedNode(prev => ({
      ...prev,
      files: prev.files.filter(file => file._id !== fileId && file.id !== fileTemporaryId),
    }));
    // If the file has a MongoDB ID, send an IPC message to delete it from the database
    if (fileId) {
      if (typeof window !== 'undefined' && window.electron) {
        window.electron.ipcRenderer.send('delete-file', fileId); // You'll need to implement this IPC handler in main.js
      } else {
        // TODO: Replace with REST API call to delete file when not in Electron
        console.error('Electron IPC not available. Use REST API here.');
      }
    }
  };

  // Listen for file saving responses (optional, for confirmation and updating IDs)
  useEffect(() => {
    const handleFileSaveResponse = (event: any, response: any) => {
      if (response.success && editedNode._id === response.nodeId) { // Check if the response is for the current node
        console.log('File saved successfully:', response.file);
        // Find the corresponding file in the editedNode's files array by temporary ID or name
        // and update it with the MongoDB _id and path
        setEditedNode(prev => ({
          ...prev,
          files: prev.files.map(file =>
            file.id === response.file.temporaryId ? { ...file, _id: response.file._id, path: response.file.path, data: undefined } : file // Update with DB info
          ),
        }));
      } else if (!response.success) {
        console.error('Failed to save file:', response.error);
        // Show an error message
      }
    };

    if (typeof window !== 'undefined' && window.electron) {
      window.electron.ipcRenderer.on('save-file-response', handleFileSaveResponse);
      return () => {
        window.electron.ipcRenderer.removeListener('save-file-response', handleFileSaveResponse);
      };
    } else {
      // TODO: Add REST API response handling if needed
      return () => {};
    }
  }, [editedNode._id]); // Add editedNode._id as a dependency

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-[95vw]">
        <SheetHeader>
          <SheetTitle>Edit Node</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={editedNode.title}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={editedNode.description}
              onChange={handleTextareaChange}
              className="col-span-3"
            />
          </div>
          {/* Done Switch */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isDone" className="text-right">
              Done
            </Label>
            <Switch
              id="isDone"
              checked={editedNode.isDone}
              onCheckedChange={handleSwitchChange}
              className="col-span-3"
            />
          </div>

          {/* File Attachment Section */}
          <div>
            <Label>Attached Files:</Label>
            <input
              type="file"
              id="file-input"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              multiple
            />
            <label htmlFor="file-input" className="cursor-pointer underline text-blue-600 flex items-center">
              <FileIcon className="mr-2 h-4 w-4" /> Attach File
            </label>
            <ul>
              {attachedFiles.map((file) => (
                <li key={file._id || file.id}> {/* Use _id or temporary id for key */}
                  <span className="cursor-pointer text-blue-600" onClick={() => handleFileClick(file.path)}>
                    {file.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file._id, file.id)}>
                     <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <SheetFooter>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Node
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your node and its associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave}>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default NodeEditor;
