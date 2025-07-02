// src/components/maps/map-connections.tsx

'use client';

import React from 'react';
// Import Node and Connection from the consolidated types file
import { type Node, type Connection } from '@/lib/types';

interface MapConnectionsProps {
    nodes: Node[];
    connections: Connection[];
    linkingState: { active: boolean; from: string | null };
    mousePosition: { x: number; y: number } | null;
}

const NODE_WIDTH = 256;
const NODE_HEIGHT = 56; // Approximated from MapNode styling

export function MapConnections({ nodes, connections, linkingState, mousePosition }: MapConnectionsProps) {
    // Helper function to find a node by its _id or temporary frontend id
    const getNodeById = (id: string | null): Node | undefined => nodes.find(n => n._id === id || n.id === id);

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            {connections.map((conn, index) => {
                // Handle both populated Node objects and ObjectId strings for start/end nodes
                const fromNode = typeof conn.startNode !== 'string' ? conn.startNode : getNodeById(conn.startNode);
                const toNode = typeof conn.endNode !== 'string' ? conn.endNode : getNodeById(conn.endNode);

                if (!fromNode || !toNode) return null;

                // Calculate start and end points of the connection line
                // Assuming connections are from the center of the right side of the start node
                // to the center of the left side of the end node. Adjust if your UI requires different connection points.
                const startPoint = {
                    x: fromNode.position.x + NODE_WIDTH,
                    y: fromNode.position.y + NODE_HEIGHT / 2,
                };

                const endPoint = {
                    x: toNode.position.x,
                    y: toNode.position.y + NODE_HEIGHT / 2,
                };

                // Draw a simple line for the connection
                return (
                    <line
                        key={conn._id || index} // Use connection _id if available, otherwise index
                        x1={startPoint.x}
                        y1={startPoint.y}
                        x2={endPoint.x}
                        y2={endPoint.y}
                        stroke="currentColor" // You can use a different color or style
                        strokeWidth="2"
                        className="text-muted-foreground" // Example class for styling
                    />
                );
            })}

            {/* Optional: Draw a temporary line while linking nodes */}
            {linkingState.active && linkingState.from && mousePosition && (() => {
                const fromNode = getNodeById(linkingState.from);
                if (!fromNode) return null;

                 const startPoint = {
                    x: fromNode.position.x + NODE_WIDTH,
                    y: fromNode.position.y + NODE_HEIGHT / 2,
                };

                return (
                    <line
                        x1={startPoint.x}
                        y1={startPoint.y}
                        x2={mousePosition.x}
                        y2={mousePosition.y}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-primary" // Example class for styling
                        strokeDasharray="5,5" // Dashed line for linking
                    />
                );
            })()}
        </svg>
    );
}
