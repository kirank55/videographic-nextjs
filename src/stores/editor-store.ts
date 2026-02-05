"use client";

import { create } from "zustand";
import type { VideoProject, TimelineEvent } from "@/lib/schemas/timeline";

interface EditorState {
  // Project state
  project: VideoProject | null;
  currentTime: number;
  isPlaying: boolean;
  selectedIds: Set<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any | null; // fabric.Canvas

  // History for undo/redo
  history: VideoProject[];
  historyIndex: number;
  isUndoRedoing: boolean;

  // Computed helper for backwards compatibility
  selectedId: string | null;

  // Actions
  setProject: (project: VideoProject) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: Set<string>) => void;
  toggleSelectedId: (id: string, isMultiSelect: boolean) => void;
  clearSelection: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCanvas: (canvas: any) => void;

  // Event mutations
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  updateEventProperty: (id: string, property: string, value: unknown) => void;
  addEvent: (event: TimelineEvent) => void;
  duplicateSelectedEvents: () => void;
  deleteEvent: (id: string) => void;
  deleteSelectedEvents: () => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setEventLayer: (id: string, layer: number) => void;
  centerSelectedEvents: () => void;
  centerSelectedEventsHorizontally: () => void;
  centerSelectedEventsVertically: () => void;

  // Project mutations
  updateProjectBackgroundColor: (color: string) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  currentTime: 0,
  isPlaying: false,
  selectedIds: new Set<string>(),
  canvas: null,

  history: [],
  historyIndex: -1,
  isUndoRedoing: false,

  // Computed property for backwards compatibility - returns first selected ID
  get selectedId() {
    const ids = get().selectedIds;
    return ids.size > 0 ? Array.from(ids)[0] : null;
  },

  setProject: (project) => {
    set({
      project,
      history: [project],
      historyIndex: 0,
      currentTime: 0,
      selectedIds: new Set<string>(),
      isPlaying: false,
    });
  },

  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  // Set a single selection (clears others)
  setSelectedId: (id) => set({ selectedIds: id ? new Set([id]) : new Set() }),
  
  // Set multiple selections
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  
  // Toggle selection with multi-select support (Ctrl/Cmd+click)
  toggleSelectedId: (id, isMultiSelect) => {
    set((state) => {
      const newIds = new Set(state.selectedIds);
      if (isMultiSelect) {
        // Multi-select mode: toggle the clicked item
        if (newIds.has(id)) {
          newIds.delete(id);
        } else {
          newIds.add(id);
        }
      } else {
        // Single select mode: select only this item
        newIds.clear();
        newIds.add(id);
      }
      return { selectedIds: newIds };
    });
  },
  
  clearSelection: () => set({ selectedIds: new Set() }),
  
  setCanvas: (canvas) => set({ canvas }),

  saveToHistory: () => {
    const { project, history, historyIndex } = get();
    if (!project) return;

    // Truncate history at current position and add new state
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(project)));

    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        project: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex,
        isUndoRedoing: true,
      });
      // Reset flag after state update
      setTimeout(() => set({ isUndoRedoing: false }), 0);
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        project: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex,
        isUndoRedoing: true,
      });
      // Reset flag after state update
      setTimeout(() => set({ isUndoRedoing: false }), 0);
    }
  },
  
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },
  
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  updateEvent: (id, updates) => {
    set((state) => {
      if (!state.project) return {};
      const newEvents = state.project.events.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      return { project: { ...state.project, events: newEvents } };
    });
  },

  updateEventProperty: (id, property, value) => {
    set((state) => {
      if (!state.project) return {};
      const newEvents = state.project.events.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            properties: { ...e.properties, [property]: value },
          };
        }
        return e;
      });
      return { project: { ...state.project, events: newEvents } };
    });
  },

  addEvent: (event) => {
    set((state) => {
      if (!state.project) return {};
      return {
        project: {
          ...state.project,
          events: [...state.project.events, event],
        },
      };
    });
    get().saveToHistory();
  },

  duplicateSelectedEvents: () => {
    const { selectedIds, project } = get();
    if (selectedIds.size === 0 || !project) return;
    
    const newEvents: TimelineEvent[] = [];
    const newSelectedIds: string[] = [];
    
    selectedIds.forEach((id) => {
      const eventToDuplicate = project.events.find((e) => e.id === id);
      if (!eventToDuplicate) return;
      
      // Create a deep copy with a new ID
      const newEvent: TimelineEvent = {
        ...JSON.parse(JSON.stringify(eventToDuplicate)),
        id: `${eventToDuplicate.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        layer: project.events.length + newEvents.length,
      };
      
      // Offset position slightly so it's visible as a duplicate
      if ('x' in newEvent.properties && 'y' in newEvent.properties) {
        (newEvent.properties as { x: number; y: number }).x += 30;
        (newEvent.properties as { x: number; y: number }).y += 30;
      }
      
      newEvents.push(newEvent);
      newSelectedIds.push(newEvent.id);
    });
    
    set((state) => {
      if (!state.project) return {};
      return {
        project: {
          ...state.project,
          events: [...state.project.events, ...newEvents],
        },
        selectedIds: new Set(newSelectedIds), // Select the new duplicated elements
      };
    });
    get().saveToHistory();
  },

  deleteEvent: (id) => {
    set((state) => {
      if (!state.project) return {};
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(id);
      return {
        project: {
          ...state.project,
          events: state.project.events.filter((e) => e.id !== id),
        },
        selectedIds: newSelectedIds,
      };
    });
    get().saveToHistory();
  },
  
  deleteSelectedEvents: () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    
    set((state) => {
      if (!state.project) return {};
      return {
        project: {
          ...state.project,
          events: state.project.events.filter((e) => !state.selectedIds.has(e.id)),
        },
        selectedIds: new Set(),
      };
    });
    get().saveToHistory();
  },

  reorderLayers: (fromIndex, toIndex) => {
    set((state) => {
      if (!state.project) return {};
      const events = [...state.project.events];
      const [moved] = events.splice(fromIndex, 1);
      events.splice(toIndex, 0, moved);
      // Update layer values based on new order
      const updatedEvents = events.map((event, idx) => ({
        ...event,
        layer: idx,
      }));
      return { project: { ...state.project, events: updatedEvents } };
    });
    get().saveToHistory();
  },

  centerSelectedEvents: () => {
    const { selectedIds, project } = get();
    if (selectedIds.size === 0 || !project) return;

    const canvasWidth = project.width;
    const canvasHeight = project.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    set((state) => {
      if (!state.project) return {};
      const newEvents = state.project.events.map((e) => {
        if (selectedIds.has(e.id) && 'x' in e.properties && 'y' in e.properties) {
          return {
            ...e,
            properties: {
              ...e.properties,
              x: centerX,
              y: centerY,
            },
          };
        }
        return e;
      });
      return { project: { ...state.project, events: newEvents } };
    });
    get().saveToHistory();
  },

  centerSelectedEventsHorizontally: () => {
    const { selectedIds, project } = get();
    if (selectedIds.size === 0 || !project) return;

    const canvasWidth = project.width;
    const centerX = canvasWidth / 2;

    set((state) => {
      if (!state.project) return {};
      const newEvents = state.project.events.map((e) => {
        if (selectedIds.has(e.id) && 'x' in e.properties) {
          return {
            ...e,
            properties: {
              ...e.properties,
              x: centerX,
            },
          };
        }
        return e;
      });
      return { project: { ...state.project, events: newEvents } };
    });
    get().saveToHistory();
  },

  centerSelectedEventsVertically: () => {
    const { selectedIds, project } = get();
    if (selectedIds.size === 0 || !project) return;

    const canvasHeight = project.height;
    const centerY = canvasHeight / 2;

    set((state) => {
      if (!state.project) return {};
      const newEvents = state.project.events.map((e) => {
        if (selectedIds.has(e.id) && 'y' in e.properties) {
          return {
            ...e,
            properties: {
              ...e.properties,
              y: centerY,
            },
          };
        }
        return e;
      });
      return { project: { ...state.project, events: newEvents } };
    });
    get().saveToHistory();
  },

  setEventLayer: (id, layer) => {
    set((state) => {
      if (!state.project) return {};
      const newEvents = state.project.events.map((e) =>
        e.id === id ? { ...e, layer } : e
      );
      return { project: { ...state.project, events: newEvents } };
    });
    get().saveToHistory();
  },

  updateProjectBackgroundColor: (color) => {
    set((state) => {
      if (!state.project) return {};
      return { project: { ...state.project, backgroundColor: color } };
    });
    get().saveToHistory();
  },
}));
