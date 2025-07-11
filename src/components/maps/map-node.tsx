'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { type Node } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, File } from 'lucide-react';

interface MapNodeProps {
    node: Node;
    onClick: (node: Node) => void;
    onDrag: (nodeId: string, position: { x: number, y: number }, width: number, height: number) => void;
    isLinking: boolean;
    scale: number;
}

export const MapNode = ({ node, onClick, onDrag, isLinking, scale }: MapNodeProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = React.useRef({ x: 0, y: 0 });
        const nodeStartPos = React.useRef({ x: 0, y: 0 });

    const getScaledDimensions = (size: string | undefined) => {
        const baseWidth = 256;
        const baseHeight = 56;
        let scaleFactor = 1;
        switch (size) {
            case "50%": scaleFactor = 0.5; break;
            case "75%": scaleFactor = 0.75; break;
            case "125%": scaleFactor = 1.25; break;
            case "150%": scaleFactor = 1.5; break;
            case "200%": scaleFactor = 2.0; break;
            default: scaleFactor = 1.0; break;
        }
        return { width: baseWidth * scaleFactor, height: baseHeight * scaleFactor };
    };

    const { width: nodeWidth, height: nodeHeight } = getScaledDimensions(node.size);

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
        const dx = (e.clientX - dragStartPos.current.x) / scale;
        const dy = (e.clientY - dragStartPos.current.y) / scale;
        onDrag(node.id, { x: nodeStartPos.current.x + dx, y: nodeStartPos.current.y + dy }, nodeWidth, nodeHeight);
    }, [isDragging, node.id, onDrag, scale, nodeWidth, nodeHeight]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const dx = (e.clientX - dragStartPos.current.x) / scale;
            const dy = (e.clientY - dragStartPos.current.y) / scale;
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
                onClick(node);
            }
        }
        setIsDragging(false);
    }, [isDragging, node, onClick, scale]);
    
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
                "absolute transition-shadow duration-200 rounded-lg flex items-center justify-center",
                isDragging ? 'shadow-2xl scale-105 z-20' : 'z-10',
                node.isDone && 'opacity-70'
            )}
            style={{
                left: node.position.x,
                top: node.position.y,
                cursor: cursorStyle,
                width: nodeWidth,
                height: nodeHeight,
            }}
            onMouseDown={handleMouseDown}
        >
            <Card className={cn(
                "w-full h-full bg-card shadow-lg border-2 border-primary/50 hover:border-primary transition-colors duration-200 flex flex-col justify-center",
                node.isDone && "border-green-500/50 hover:border-green-500 bg-secondary"
            )}
            style={{ backgroundColor: node.color || undefined }}
            >
                <CardHeader className="p-4 flex flex-row items-center justify-between gap-2">
                    <CardTitle className={cn("text-center", node.isDone && "line-through")}
                      style={{ fontSize: `${1 * (nodeWidth / 256)}rem`, lineHeight: '1.2' }}
                    >{node.title}</CardTitle>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                        {node.files.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <File className="h-3 w-3" />
                                <span>{node.files.length}</span>
                            </div>
                        )}
                        {node.isDone && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
};
