// src/components/maps/map-canvas.tsx

// TODO: Integrate REST API calls for all data operations when running in browser/Next.js. Do not change any UI or styling.

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import { MapNode } from './map-node'; // Ensure correct import name (MapNode is exported as const)
import { MapConnections } from './map-connections'; // Ensure correct import name (MapConnections is exported as function)
import NodeEditor from './node-editor';
import { type NodeData, type FileData, type ConnectionData, type MapData, type Node, type Connection } from '@/lib/types'; // Import all necessary types
import { useToast } from '@/hooks/use-toast';

// Declare 'electron' to avoid TypeScript errors if you're using TypeScript
declare global {
  interface Window {
    electron: any;
  }
}

interface MapCanvasProps {
  map: MapData | null; // Define the map prop with the correct type
}


const MapCanvas = ({ map }: MapCanvasProps) => {
  const [mapData, setMapData] = useState<MapData | null>(map);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [linkingState, setLinkingState] = useState<{ active: boolean; from: string | null }>({ active: false, from: null });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Function to save the current map data
  const saveMap = useCallback(() => {
    if (mapData) {
      setIsSaving(true);
      // Access window.electron only on the client side
      if (typeof window !== 'undefined' && window.electron) {
        window.electron.ipcRenderer.send('save-map-data', mapData);
      } else {
        // TODO: Replace with REST API call to save map data when not in Electron
        console.error('Electron IPC not available. Use REST API here.');
      }
    }
  }, [mapData]);

  // Function to add a new node
  const addNode = () => {
    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    const newNode: NodeData = {
      id: crypto.randomUUID(), // Use UUID for temporary frontend ID
      position: {
        x: canvasBounds ? canvasBounds.width / 2 - 128 : 200,
        y: canvasBounds ? canvasBounds.height / 2 - 50 : 150
      },
      title: 'New Node',
      description: '',
      links: [],
      files: [],
      isDone: false,
    };
    setMapData(prevMapData => {
      if (!prevMapData) return null;
      return { ...prevMapData, nodes: [...prevMapData.nodes, newNode] };
    });
    setSelectedNode(newNode);
    setEditorOpen(true);
  };

  // Function to update a node in the mapData state
  const updateNode = (updatedNode: NodeData) => {
    setMapData(prevMapData => {
      if (!prevMapData) return null;
      // Update based on temporary frontend ID or MongoDB _id
      const updatedNodes = prevMapData.nodes.map(node =>
        node._id === updatedNode._id ? updatedNode : node.id === updatedNode.id ? updatedNode : node
      );
      return { ...prevMapData, nodes: updatedNodes };
    });
    if (selectedNode?.id === updatedNode.id || selectedNode?._id === updatedNode._id) {
      setSelectedNode(updatedNode);
    }
    toast({ title: "Node updated", description: `"${updatedNode.title}" has been updated locally.` });
  };

  // Function to delete a node
  const deleteNode = (nodeIdentifier: string | undefined) => {
    if (!nodeIdentifier) {
      console.warn("Attempted to delete node without an identifier.");
      return;
    }
    setMapData(prevMapData => {
      if (!prevMapData) return null;
      const updatedNodes = prevMapData.nodes.filter(node => node._id !== nodeIdentifier && node.id !== nodeIdentifier);
       // Also remove connections related to this node
      const updatedConnections = prevMapData.connections.filter(connection =>
        // Check both populated Node object and ObjectId string
        (typeof connection.startNode !== 'string' && connection.startNode._id !== nodeIdentifier) ||
        (typeof connection.startNode === 'string' && connection.startNode !== nodeIdentifier) ||
        (typeof connection.endNode !== 'string' && connection.endNode._id !== nodeIdentifier) ||
        (typeof connection.endNode === 'string' && connection.endNode !== nodeIdentifier)
      );
      return { ...prevMapData, nodes: updatedNodes, connections: updatedConnections };
    });
    setSelectedNode(null);
    setEditorOpen(false);
    // Send IPC message to delete the node and its associated files/connections from the database
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.ipcRenderer.send('delete-node', nodeIdentifier); // You'll need to implement this handler in main.js
    } else {
      // TODO: Replace with REST API call to delete node when not in Electron
      console.error('Electron IPC not available. Use REST API here.');
    }
  };


  const handleNodeClick = (node: NodeData) => {
    if (linkingState.active && linkingState.from) {
      // Handle creating a connection (you'll need to implement this fully)
      console.log(`Linking from ${linkingState.from} to ${node._id || node.id}`);
      setLinkingState({ active: false, from: null });
      // Create a new connection object and update mapData
      // You'll need to ensure connection data is saved to DB
    } else {
      setSelectedNode(node);
      setEditorOpen(true);
    }
  };

  // Adjusted handleNodeDrag to accept string | undefined
  const handleNodeDrag = (nodeIdentifier: string | undefined, newPosition: { x: number; y: number }) => {
    if (!nodeIdentifier) {
      console.warn("Attempted to drag node without an identifier.");
      return;
    }
    setMapData(prevMapData => {
      if (!prevMapData) return null;
      const updatedNodes = prevMapData.nodes.map(node =>
        node._id === nodeIdentifier || node.id === nodeIdentifier ? { ...node, position: newPosition } : node
      );
      return { ...prevMapData, nodes: updatedNodes };
    });
  };

  const toggleLinkingMode = () => {
    setLinkingState(prev => ({ active: !prev.active, from: null }));
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  // Update mapData state when the map prop changes
  useEffect(() => {
    setMapData(map);
  }, [map]);


  // Load maps and set up IPC listeners on component mount
  useEffect(() => {
    // Ensure window.electron is available before setting up listeners
    if (typeof window !== 'undefined' && window.electron) {
      // Listen for responses from the main process
      window.electron.ipcRenderer.on('save-map-data-response', (event: any, response: any) => {
        if (response.success) {
          console.log('Map saved successfully:', response.map);
          // Update your state with the saved map data (including MongoDB IDs)
          setMapData(response.map);
          toast({ title: "Map saved", description: `"${response.map.name}" has been saved locally.` });
        } else {
          console.error('Failed to save map:', response.error);
          toast({ title: "Error saving map", description: response.error, variant: "destructive" });
        }
        setIsSaving(false);
      });

      // Listen for file deletion responses (optional)
      window.electron.ipcRenderer.on('delete-file-response', (event: any, response: any) => {
        if (response.success) {
          console.log('File deleted successfully:', response.fileId);
          // You might want to update the node state to remove the deleted file reference
        } else {
          console.error('Failed to delete file:', response.error);
          // Show an error message
        }
      });

      // Listen for node deletion responses (optional)
      window.electron.ipcRenderer.on('delete-node-response', (event: any, response: any) => {
        if (response.success) {
          console.log('Node deleted successfully:', response.nodeId);
          // The state is already updated in the frontend, but this confirms backend deletion
          toast({ title: "Node deleted", description: "Node removed successfully." });
        } else {
          console.error('Failed to delete node:', response.error);
          toast({ title: "Error deleting node", description: response.error, variant: "destructive" });
        }
      });

      // Clean up the listeners when the component unmounts
      return () => {
        window.electron.ipcRenderer.removeAllListeners('save-map-data-response');
        window.electron.ipcRenderer.removeAllListeners('delete-file-response');
        window.electron.ipcRenderer.removeAllListeners('delete-node-response');
      };
    }
    // If window.electron is not available, return a cleanup function that does nothing
    return () => {};
  }, [toast]); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Ensure nodes and connections are arrays before mapping
  const nodesToRender = Array.isArray(mapData?.nodes) ? mapData?.nodes : [];
  const connectionsToRender = Array.isArray(mapData?.connections) ? mapData?.connections : [];

  return (
    <div className="w-full h-full relative overflow-hidden bg-dot-zinc-700/[0.4] border rounded-lg flex-1" onMouseMove={handleMouseMove} onMouseLeave={() => setMousePosition(null)}>
      <div className="absolute top-4 left-4 z-30 flex gap-2">
        <Button onClick={addNode}>
          <Plus className="mr-2 h-4 w-4" /> Add Node
        </Button>
        <Button variant={linkingState.active ? "secondary" : "outline"} onClick={toggleLinkingMode}>
          <LinkIcon className="mr-2 h-4 w-4" />
          {linkingState.active ? (linkingState.from ? 'Select node...' : 'Cancel') : 'Link Nodes'}
        </Button>
        <Button variant="outline" onClick={saveMap} disabled={isSaving || !mapData}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Map'}
        </Button>
      </div>

      <div ref={canvasRef} className="w-full h-full" style={{ backgroundSize: '20px 20px' }}>
        {/* Pass populated nodes and connections to MapConnections */}
        {/* Cast nodesToRender and connectionsToRender to the expected types of MapConnections props */}
        <MapConnections nodes={nodesToRender as Node[]} connections={connectionsToRender as Connection[]} linkingState={linkingState} mousePosition={mousePosition} />
        {nodesToRender.map((node) => (
          <MapNode
            key={node._id || node.id} // Use MongoDB _id if available, otherwise use temporary frontend id
            node={node as Node} // Pass the node data, cast to Node for MapNode prop type
            onClick={() => handleNodeClick(node)}
            onDrag={((nodeIdentifierFromEvent: string | undefined, newPositionFromEvent: { x: number; y: number }) =>
      handleNodeDrag(nodeIdentifierFromEvent, newPositionFromEvent)
    )}
            isLinking={linkingState.active}
          />
        ))}
      </div>

      {/* Render the NodeEditor when a node is selected and editor is open */}
      {selectedNode && (
        <NodeEditor
          isOpen={isEditorOpen}
          onOpenChange={(open) => {
             setEditorOpen(open);
             if (!open) {
               setSelectedNode(null); // Deselect node when editor closes
             }
          }}
          node={selectedNode}
          onUpdate={updateNode}
          onDelete={() => deleteNode(selectedNode._id || selectedNode.id)} // Pass the node identifier to delete
        />
      )}
    </div>
  );
};

export default MapCanvas;
