/**
 * Excalidraw State Serialization Utilities
 */

interface ExcalidrawElement {
  id: string
  type: string
  [key: string]: any
}

interface ExcalidrawAppState {
  zoom?: { value: number }
  scrollX?: number
  scrollY?: number
  [key: string]: any
}

interface ExcalidrawState {
  elements?: ExcalidrawElement[]
  appState?: ExcalidrawAppState
  [key: string]: any
}

/**
 * Serializes Excalidraw elements and app state to a JSON string
 * @param elements - Array of Excalidraw elements
 * @param appState - Excalidraw app state object
 * @returns JSON string representation
 */
export function serializeExcalidrawState(
  elements: ExcalidrawElement[],
  appState: ExcalidrawAppState
): string {
  const state: ExcalidrawState = {
    elements,
    appState,
  }
  return JSON.stringify(state)
}

/**
 * Deserializes a JSON string to Excalidraw state
 * @param jsonString - JSON string containing Excalidraw state
 * @returns Object with elements and appState properties
 */
export function deserializeExcalidrawState(jsonString: string): ExcalidrawState {
  try {
    const state = JSON.parse(jsonString)
    return {
      elements: state.elements || [],
      appState: state.appState || {},
      ...state,
    }
  } catch (error) {
    console.error('Failed to deserialize Excalidraw state:', error)
    throw new Error('Invalid Excalidraw state JSON')
  }
}

/**
 * Generates a thumbnail for the whiteboard
 * For now, returns a placeholder. Full implementation would use canvas rendering.
 * @param elements - Array of Excalidraw elements
 * @returns Base64 encoded thumbnail image or null
 */
export async function generateThumbnail(
  elements: ExcalidrawElement[]
): Promise<string | null> {
  // Placeholder implementation
  // In a real implementation, this would:
  // 1. Render the Excalidraw canvas to a canvas element
  // 2. Convert to base64 PNG
  // 3. Return the data URL
  
  if (!elements || elements.length === 0) {
    return null
  }

  return null // Placeholder for now
}

/**
 * Initializes an empty Excalidraw board state
 * @returns JSON string with empty board state
 */
export function initializeEmptyBoard(): string {
  const emptyState: ExcalidrawState = {
    elements: [],
    appState: {
      zoom: { value: 1 },
      scrollX: 0,
      scrollY: 0,
    },
  }
  return JSON.stringify(emptyState)
}
