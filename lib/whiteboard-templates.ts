/**
 * Excalidraw Template Definitions
 * Provides predefined board templates for common use cases
 */

export interface WhiteboardTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  elements: any[] // Excalidraw elements
}

/**
 * Blank Canvas Template - Empty starting point
 */
const BLANK_CANVAS: WhiteboardTemplate = {
  id: 'blank-canvas',
  name: 'Blank Canvas',
  description: 'Start with an empty canvas',
  thumbnail: '📄',
  elements: [],
}

/**
 * Meeting Agenda Template - Structured meeting with attendees, agenda, and action items
 */
const MEETING_AGENDA: WhiteboardTemplate = {
  id: 'meeting-agenda',
  name: 'Meeting Agenda',
  description: 'Structured meeting with attendees, agenda, and action items',
  thumbnail: '📋',
  elements: [
    {
      id: 'title',
      type: 'text',
      x: 50,
      y: 20,
      width: 700,
      height: 50,
      text: 'Meeting Title',
      fontSize: 32,
      fontFamily: 1,
      textAlign: 'left',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Meeting Title',
    },
    {
      id: 'attendees-label',
      type: 'text',
      x: 50,
      y: 100,
      width: 150,
      height: 30,
      text: 'Attendees:',
      fontSize: 18,
      fontFamily: 1,
      textAlign: 'left',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Attendees:',
    },
    {
      id: 'agenda-label',
      type: 'text',
      x: 50,
      y: 200,
      width: 150,
      height: 30,
      text: 'Agenda:',
      fontSize: 18,
      fontFamily: 1,
      textAlign: 'left',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Agenda:',
    },
    {
      id: 'actions-label',
      type: 'text',
      x: 50,
      y: 400,
      width: 200,
      height: 30,
      text: 'Action Items:',
      fontSize: 18,
      fontFamily: 1,
      textAlign: 'left',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Action Items:',
    },
    {
      id: 'attendees-box',
      type: 'rectangle',
      x: 50,
      y: 140,
      width: 700,
      height: 40,
      strokeColor: '#878e96',
      backgroundColor: '#ffffff',
      fillStyle: 'hachure',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'agenda-box',
      type: 'rectangle',
      x: 50,
      y: 240,
      width: 700,
      height: 140,
      strokeColor: '#878e96',
      backgroundColor: '#ffffff',
      fillStyle: 'hachure',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'actions-box',
      type: 'rectangle',
      x: 50,
      y: 440,
      width: 700,
      height: 140,
      strokeColor: '#878e96',
      backgroundColor: '#ffffff',
      fillStyle: 'hachure',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
    },
  ],
}

/**
 * Sprint Retrospective Template - Three columns: What went well, What to improve, Action items
 */
const SPRINT_RETROSPECTIVE: WhiteboardTemplate = {
  id: 'sprint-retrospective',
  name: 'Sprint Retrospective',
  description: 'Three-column retro board: What went well, What to improve, Action items',
  thumbnail: '🔄',
  elements: [
    // Column 1: What went well
    {
      id: 'col1-box',
      type: 'rectangle',
      x: 50,
      y: 80,
      width: 250,
      height: 480,
      strokeColor: '#2f9e44',
      backgroundColor: '#d3f9d8',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'col1-title',
      type: 'text',
      x: 60,
      y: 90,
      width: 230,
      height: 40,
      text: 'What went well ✓',
      fontSize: 18,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'What went well ✓',
    },
    // Column 2: What to improve
    {
      id: 'col2-box',
      type: 'rectangle',
      x: 350,
      y: 80,
      width: 250,
      height: 480,
      strokeColor: '#f59f00',
      backgroundColor: '#ffe066',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'col2-title',
      type: 'text',
      x: 360,
      y: 90,
      width: 230,
      height: 40,
      text: 'What to improve →',
      fontSize: 18,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'What to improve →',
    },
    // Column 3: Action items
    {
      id: 'col3-box',
      type: 'rectangle',
      x: 650,
      y: 80,
      width: 250,
      height: 480,
      strokeColor: '#e03131',
      backgroundColor: '#ffe0e0',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'col3-title',
      type: 'text',
      x: 660,
      y: 90,
      width: 230,
      height: 40,
      text: 'Action items !',
      fontSize: 18,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Action items !',
    },
  ],
}

/**
 * Brainstorm Canvas - Central topic with 4 branches radiating out
 */
const BRAINSTORM_CANVAS: WhiteboardTemplate = {
  id: 'brainstorm-canvas',
  name: 'Brainstorm Canvas',
  description: 'Central topic with ideas branching out',
  thumbnail: '💡',
  elements: [
    // Center topic circle
    {
      id: 'center-circle',
      type: 'diamond',
      x: 400,
      y: 200,
      width: 150,
      height: 150,
      strokeColor: '#5c7cfa',
      backgroundColor: '#dbe4ff',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'center-text',
      type: 'text',
      x: 410,
      y: 265,
      width: 130,
      height: 40,
      text: 'Topic',
      fontSize: 20,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Topic',
    },
    // Branch 1: Top
    {
      id: 'branch1-arrow',
      type: 'arrow',
      x: 475,
      y: 200,
      width: 0,
      height: -100,
      startArrowType: null,
      endArrowType: 'arrow',
    },
    {
      id: 'branch1-box',
      type: 'rectangle',
      x: 420,
      y: 50,
      width: 110,
      height: 80,
      strokeColor: '#1971c2',
      backgroundColor: '#e3f2fd',
      fillStyle: 'hachure',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'branch1-text',
      type: 'text',
      x: 425,
      y: 80,
      width: 100,
      height: 30,
      text: 'Idea 1',
      fontSize: 14,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Idea 1',
    },
    // Branch 2: Right
    {
      id: 'branch2-arrow',
      type: 'arrow',
      x: 550,
      y: 275,
      width: 100,
      height: 0,
      startArrowType: null,
      endArrowType: 'arrow',
    },
    {
      id: 'branch2-box',
      type: 'rectangle',
      x: 650,
      y: 240,
      width: 110,
      height: 80,
      strokeColor: '#1971c2',
      backgroundColor: '#e3f2fd',
      fillStyle: 'hachure',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'branch2-text',
      type: 'text',
      x: 655,
      y: 270,
      width: 100,
      height: 30,
      text: 'Idea 2',
      fontSize: 14,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Idea 2',
    },
    // Branch 3: Bottom
    {
      id: 'branch3-arrow',
      type: 'arrow',
      x: 475,
      y: 350,
      width: 0,
      height: 100,
      startArrowType: null,
      endArrowType: 'arrow',
    },
    {
      id: 'branch3-box',
      type: 'rectangle',
      x: 420,
      y: 450,
      width: 110,
      height: 80,
      strokeColor: '#1971c2',
      backgroundColor: '#e3f2fd',
      fillStyle: 'hachure',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'branch3-text',
      type: 'text',
      x: 425,
      y: 480,
      width: 100,
      height: 30,
      text: 'Idea 3',
      fontSize: 14,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Idea 3',
    },
    // Branch 4: Left
    {
      id: 'branch4-arrow',
      type: 'arrow',
      x: 400,
      y: 275,
      width: -100,
      height: 0,
      startArrowType: null,
      endArrowType: 'arrow',
    },
    {
      id: 'branch4-box',
      type: 'rectangle',
      x: 190,
      y: 240,
      width: 110,
      height: 80,
      strokeColor: '#1971c2',
      backgroundColor: '#e3f2fd',
      fillStyle: 'hachure',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'branch4-text',
      type: 'text',
      x: 195,
      y: 270,
      width: 100,
      height: 30,
      text: 'Idea 4',
      fontSize: 14,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Idea 4',
    },
  ],
}

/**
 * Architecture Diagram Template - Three connected boxes representing system components
 */
const ARCHITECTURE_DIAGRAM: WhiteboardTemplate = {
  id: 'architecture-diagram',
  name: 'Architecture Diagram',
  description: 'System architecture with interconnected components',
  thumbnail: '🏗️',
  elements: [
    // Client box
    {
      id: 'client-box',
      type: 'rectangle',
      x: 50,
      y: 200,
      width: 150,
      height: 100,
      strokeColor: '#5c7cfa',
      backgroundColor: '#dbe4ff',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'client-text',
      type: 'text',
      x: 60,
      y: 240,
      width: 130,
      height: 30,
      text: 'Client',
      fontSize: 16,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Client',
    },
    // API/Server box
    {
      id: 'server-box',
      type: 'rectangle',
      x: 350,
      y: 200,
      width: 150,
      height: 100,
      strokeColor: '#f59f00',
      backgroundColor: '#ffe066',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'server-text',
      type: 'text',
      x: 360,
      y: 240,
      width: 130,
      height: 30,
      text: 'API Server',
      fontSize: 16,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'API Server',
    },
    // Database box
    {
      id: 'db-box',
      type: 'rectangle',
      x: 650,
      y: 200,
      width: 150,
      height: 100,
      strokeColor: '#2f9e44',
      backgroundColor: '#d3f9d8',
      fillStyle: 'hachure',
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
    },
    {
      id: 'db-text',
      type: 'text',
      x: 660,
      y: 240,
      width: 130,
      height: 30,
      text: 'Database',
      fontSize: 16,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: null,
      originalText: 'Database',
    },
    // Arrow 1: Client -> Server
    {
      id: 'arrow1',
      type: 'arrow',
      x: 200,
      y: 250,
      width: 150,
      height: 0,
      startArrowType: null,
      endArrowType: 'arrow',
      strokeColor: '#495057',
    },
    // Arrow 2: Server -> Database
    {
      id: 'arrow2',
      type: 'arrow',
      x: 500,
      y: 250,
      width: 150,
      height: 0,
      startArrowType: null,
      endArrowType: 'arrow',
      strokeColor: '#495057',
    },
  ],
}

/**
 * Returns all available templates
 */
export function getAllTemplates(): WhiteboardTemplate[] {
  return [
    BLANK_CANVAS,
    MEETING_AGENDA,
    SPRINT_RETROSPECTIVE,
    BRAINSTORM_CANVAS,
    ARCHITECTURE_DIAGRAM,
  ]
}

/**
 * Returns a template by ID, or null if not found
 */
export function getTemplateById(id: string): WhiteboardTemplate | null {
  if (!id) return null
  const template = getAllTemplates().find((t) => t.id === id)
  return template || null
}

/**
 * Returns the blank canvas template
 */
export function getBlankTemplate(): WhiteboardTemplate {
  return BLANK_CANVAS
}

/**
 * Normalizes template elements by adding required Excalidraw properties
 */
export function normalizeTemplateElements(elements: any[]): any[] {
  return elements.map((el, index) => ({
    ...el,
    // Required Excalidraw properties
    version: el.version || 1,
    versionNonce: el.versionNonce || Math.floor(Math.random() * 1000000000),
    isDeleted: el.isDeleted || false,
    groupIds: el.groupIds || [],
    boundElements: el.boundElements || null,
    updated: el.updated || Date.now(),
    link: el.link || null,
    locked: el.locked || false,
    // Generate unique ID if missing
    id: el.id || `template-${Date.now()}-${index}`,
    // Angle defaults
    angle: el.angle || 0,
    // Stroke and fill defaults
    strokeWidth: el.strokeWidth || 1,
    strokeStyle: el.strokeStyle || 'solid',
    roughness: el.roughness || 0,
    opacity: el.opacity || 100,
    strokeColor: el.strokeColor || '#000000',
    backgroundColor: el.backgroundColor || 'transparent',
    fillStyle: el.fillStyle || 'hachure',
    strokeSharpness: el.strokeSharpness || 'sharp',
    seed: el.seed || Math.floor(Math.random() * 1000000),
    // Frame defaults
    frameId: el.frameId || null,
    roundness: el.roundness || null,
    // Text defaults for text elements
    ...(el.type === 'text' && {
      fontSize: el.fontSize || 20,
      fontFamily: el.fontFamily || 1,
      textAlign: el.textAlign || 'left',
      verticalAlign: el.verticalAlign || 'top',
      baseline: el.baseline || 18,
      containerId: el.containerId || null,
      originalText: el.originalText || el.text || '',
      lineHeight: el.lineHeight || 1.25,
    }),
    // Arrow defaults for arrow elements
    ...(el.type === 'arrow' && {
      startBinding: el.startBinding || null,
      endBinding: el.endBinding || null,
      startArrowhead: el.startArrowhead || null,
      endArrowhead: el.endArrowhead || 'arrow',
      points: el.points || [
        [0, 0],
        [el.width || 100, el.height || 0],
      ],
    }),
  }))
}
