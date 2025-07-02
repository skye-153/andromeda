// src/lib/types.ts

// Define FileData interface
export interface FileData {
  _id?: string; // MongoDB ID
  id?: string; // Temporary frontend ID
  name: string;
  path?: string; // Local file path (optional for new files)
  data?: Buffer; // Optional: for new files before saving
}

// Define NodeData interface - used for frontend representation and saving
export interface NodeData {
  _id?: string; // MongoDB ID
  id: string; // Temporary frontend ID (always present in frontend)
  position: { x: number; y: number };
  title: string;
  description: string;
  links: string[]; // Assuming links are just strings (you might need a separate Connection model)
  files: FileData[]; // Array of FileData
  isDone: boolean;
}

// Define ConnectionData interface - used for frontend representation and saving
export interface ConnectionData {
  _id?: string; // MongoDB ID
  // Using NodeData | string to represent either a populated Node object or its ObjectId
  startNode: NodeData | string;
  endNode: NodeData | string;
  // Add other connection properties if needed
}

// Define MapData interface - used for frontend representation and saving
export interface MapData {
  _id?: string; // MongoDB ID
  name: string;
  nodes: NodeData[]; // Array of NodeData
  connections: ConnectionData[]; // Array of ConnectionData
}

// Define the Node interface used by MapNode and MapConnections props
// This type should align with how nodes are *passed* to these components,
// which should be the populated NodeData structure.
export interface Node extends NodeData {
  // Inherits all properties from NodeData
  // You can add specific properties here if needed for MapNode/MapConnections only,
  // but ideally, NodeData should suffice if it represents the complete node structure.
}

// Define the Connection interface used by MapConnections props
// This type should align with how connections are *passed* to MapConnections,
// which should be the populated ConnectionData structure.
export interface Connection extends ConnectionData {
  // Inherits all properties from ConnectionData
  // You can add specific properties here if needed for MapConnections only.
}
