"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    eventId?: string | null;
}

export function ContextMenu({ x, y, onClose, eventId }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const {
        selectedIds,
        setSelectedId,
        duplicateSelectedEvents,
        deleteSelectedEvents,
        centerSelectedEvents,
        canUndo,
        canRedo,
        undo,
        redo,
    } = useEditorStore();

    // If eventId is provided and it's not in selectedIds, select it
    useEffect(() => {
        if (eventId && !selectedIds.has(eventId)) {
            setSelectedId(eventId);
        }
    }, [eventId, selectedIds, setSelectedId]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    // Adjust position if menu would go off screen
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let adjustedX = x;
            let adjustedY = y;

            if (x + rect.width > viewportWidth) {
                adjustedX = viewportWidth - rect.width - 10;
            }

            if (y + rect.height > viewportHeight) {
                adjustedY = viewportHeight - rect.height - 10;
            }

            menuRef.current.style.left = `${adjustedX}px`;
            menuRef.current.style.top = `${adjustedY}px`;
        }
    }, [x, y]);

    const hasSelection = selectedIds.size > 0;
    const selectionCount = selectedIds.size;

    const menuItems = [
        {
            label: selectionCount > 1 ? `Duplicate ${selectionCount} items` : "Duplicate",
            icon: "📋",
            action: () => {
                duplicateSelectedEvents();
                onClose();
            },
            disabled: !hasSelection,
            shortcut: "Ctrl+D",
        },
        {
            label: selectionCount > 1 ? `Delete ${selectionCount} items` : "Delete",
            icon: "🗑️",
            action: () => {
                deleteSelectedEvents();
                onClose();
            },
            disabled: !hasSelection,
            shortcut: "Delete",
            danger: true,
        },
        { separator: true },
        {
            label: "Copy",
            icon: "📄",
            action: () => {
                // TODO: Implement copy to clipboard
                console.log("Copy not yet implemented");
                onClose();
            },
            disabled: !hasSelection,
            shortcut: "Ctrl+C",
        },
        {
            label: "Cut",
            icon: "✂️",
            action: () => {
                // TODO: Implement cut
                console.log("Cut not yet implemented");
                onClose();
            },
            disabled: !hasSelection,
            shortcut: "Ctrl+X",
        },
        {
            label: "Paste",
            icon: "📌",
            action: () => {
                // TODO: Implement paste from clipboard
                console.log("Paste not yet implemented");
                onClose();
            },
            disabled: true, // TODO: Enable when clipboard has content
            shortcut: "Ctrl+V",
        },
        { separator: true },
        {
            label: selectionCount > 1 ? `Center ${selectionCount} items` : "Center",
            icon: "🎯",
            action: () => {
                centerSelectedEvents();
                onClose();
            },
            disabled: !hasSelection,
            shortcut: "Ctrl+E",
        },
        { separator: true },
        {
            label: "Undo",
            icon: "↶",
            action: () => {
                undo();
                onClose();
            },
            disabled: !canUndo(),
            shortcut: "Ctrl+Z",
        },
        {
            label: "Redo",
            icon: "↷",
            action: () => {
                redo();
                onClose();
            },
            disabled: !canRedo(),
            shortcut: "Ctrl+Y",
        },
    ];

    return (
        <div
            ref={menuRef}
            className="fixed z-9999 min-w-50 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ left: x, top: y }}
        >
            {menuItems.map((item, index) => {
                if ('separator' in item && item.separator) {
                    return (
                        <div
                            key={`separator-${index}`}
                            className="h-px bg-white/10 my-1"
                        />
                    );
                }

                const isDanger = 'danger' in item && item.danger;
                const isDisabled = 'disabled' in item && item.disabled;

                return (
                    <button
                        key={index}
                        onClick={item.action}
                        disabled={isDisabled}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ${
                            isDisabled
                                ? "text-gray-600 cursor-not-allowed"
                                : isDanger
                                    ? "text-red-400 hover:bg-red-500/10"
                                    : "text-white hover:bg-white/5"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                        {item.shortcut && (
                            <span className="text-xs text-gray-500">
                                {item.shortcut}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
