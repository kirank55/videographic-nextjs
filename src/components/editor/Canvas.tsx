"use client";

import { useRef, useState, useEffect } from "react";
import { useCanvas } from "./hooks/useCanvas";
import { ContextMenu } from "./ContextMenu";
import { useEditorStore } from "@/stores/editor-store";

export function Canvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useCanvas(containerRef);
    const { canvas, selectedIds } = useEditorStore();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; eventId: string | null } | null>(null);

    // Handle right-click using Fabric's mouse:down event with button detection
    useEffect(() => {
        if (!canvas) return;

        const handleMouseDown = (e: any) => {
            // Check if it's a right-click (button 3 in Fabric.js, button 2 in native events)
            if (e.button === 3 || e.e?.button === 2) {
                e.e?.preventDefault();
                e.e?.stopPropagation();

                const target = e.target;
                
                if (target && target.data?.id) {
                    // Right-clicked on an object
                    setContextMenu({
                        x: e.e.clientX,
                        y: e.e.clientY,
                        eventId: target.data.id,
                    });
                } else if (selectedIds.size > 0) {
                    // Right-clicked on empty space but have selection
                    setContextMenu({
                        x: e.e.clientX,
                        y: e.e.clientY,
                        eventId: null,
                    });
                }
            }
        };

        canvas.on('mouse:down', handleMouseDown);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
        };
    }, [canvas, selectedIds]);

    // Also prevent default context menu on the wrapper
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const preventContext = (e: MouseEvent) => {
            e.preventDefault();
        };

        wrapper.addEventListener('contextmenu', preventContext);
        return () => {
            wrapper.removeEventListener('contextmenu', preventContext);
        };
    }, []);

    return (
        <div
            ref={wrapperRef}
            className="absolute inset-0 overflow-hidden"
            style={{
                backgroundColor: "#1a1a24",
            }}
        >
            {/* 
              Container with padding that will be measured for canvas sizing.
              The canvas will be sized to fit within this padded area.
            */}
            <div
                ref={containerRef}
                style={{
                    position: "absolute",
                    top: "50px",
                    left: "50px",
                    right: "50px",
                    bottom: "50px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        boxShadow: "0 0 40px rgba(0,0,0,0.7), 0 0 80px rgba(139, 92, 246, 0.1)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.05)",
                    }}
                />
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    eventId={contextMenu.eventId}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}

