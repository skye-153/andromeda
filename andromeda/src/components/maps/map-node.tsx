// src/components/maps/map-node.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
// Import Node from the consolidated types file (which extends NodeData)
import { type Node } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

// MapNodeProps now directly uses the Node type
interface MapNodeProps {
    node: Node; // Use the updated Node type
    onClick: (node: Node) => void;
    // onDrag prop signature is already correct
    onDrag: (nodeIdentifier: string | undefined, newPosition: { x: number; y: number }) => void;
    isLinking: boolean;
}

// Update the component signature to use MapNodeProps
export const MapNode = ({ node, onClick, onDrag, isLinking }: MapNodeProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = React.useRef({ x: 0, y: 0 });
    const nodeStartPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isLinking) {
            onClick(node);
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        nodeStartPos.current = { x: node.position.x, y: node.position.y };
        e.preventDefault();
        e.stopPropagation();
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        // Pass the node identifier (_id or id) to onDrag
        onDrag(node._id || node.id, {
            x: nodeStartPos.current.x + dx,
            y: nodeStartPos.current.y + dy,
        });
    // Include node._id and node.id in the dependency array
    }, [isDragging, node._id, node.id, onDrag]);


    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
                onClick(node);
            }
        }
        setIsDragging(false);
    }, [isDragging, node, onClick]);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const cursorStyle = isLinking ? 'crosshair' : (isDragging ? 'grabbing' : 'grab');

    return (
        <div
            className={cn(
                "absolute transition-shadow duration-200 rounded-lg",
                isDragging ? 'shadow-2xl scale-105 z-20' : 'z-10',
                node.isDone && 'opacity-70'
            )}
            style={{ left: node.position.x, top: node.position.y, cursor: cursorStyle }}
            onMouseDown={handleMouseDown}
        >
            <Card className={cn(
                "w-64 bg-card shadow-lg border-2 border-primary/50 hover:border-primary transition-colors duration-200",
                node.isDone && "border-green-500/50 hover:border-green-500 bg-secondary"
            )}>
                <CardHeader className="p-4 flex flex-row items-center justify-between gap-2">
                    <CardTitle className={cn("text-base truncate", node.isDone && "line-through")}>{node.title}</CardTitle>
                    {node.isDone && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                </CardHeader>
            </Card>
        </div>
    );
};
