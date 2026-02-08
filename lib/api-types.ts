/**
 * Type definitions for API requests and responses
 * These types represent data as it comes from/goes to the database
 * (ISO string dates, JSON string fields)
 */

import type {
  Project,
  Board,
  Task,
  TimeEntry,
  TaskComment,
  TaskAttachment,
  TaskHistory,
  Activity,
} from './types'
import { transformDateFromDB, transformDateToDB, parseJSONField } from './api-utils'

/**
 * Prisma Project type (from database)
 * Dates can be Date objects or ISO strings, arrays are JSON strings
 */
export interface PrismaProject {
  id: string
  name: string
  color: string
  subcategories: string // JSON stringified array
  createdAt: string | Date // ISO date or Date object
  jiraKey: string | null
}

/**
 * Prisma Board type (from database)
 * Dates can be Date objects or ISO strings, content is JSON string
 */
export interface PrismaBoard {
  id: string
  name: string
  projectId: string | null
  thumbnailPath: string | null
  content: string // JSON stringified Excalidraw state
  createdAt: string | Date // ISO date or Date object
  updatedAt: string | Date // ISO date or Date object
  isArchived: boolean
}

/**
 * Prisma Task type (from database)
 * Dates can be Date objects or ISO strings, arrays are JSON strings
 */
export interface PrismaTask {
  id: string
  title: string
  description: string
  status: 'backlog' | 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  projectId: string
  dueDate: string | Date | null // ISO date or Date object
  subcategory: string | null
  jiraKey: string | null
  storyPoints: number | null
  createdAt: string | Date // ISO date or Date object
  updatedAt: string | Date // ISO date or Date object
  completedAt: string | Date | null // ISO date or Date object
  isArchived: boolean
  archivedAt: string | Date | null // ISO date or Date object
  blockedBy: string // JSON stringified array of task IDs
  blocking: string // JSON stringified array of task IDs
}

/**
 * Prisma TimeEntry type (from database)
 * Date can be Date object or ISO string
 */
export interface PrismaTimeEntry {
  id: string
  taskId: string
  hours: number
  minutes: number
  date: string | Date // ISO date or Date object
  notes: string
  type: 'development' | 'meeting' | 'review' | 'research' | 'debugging' | 'other'
  createdAt: string | Date // ISO date or Date object
}

/**
 * Prisma TaskComment type (from database)
 * Dates can be Date objects or ISO strings
 */
export interface PrismaTaskComment {
  id: string
  taskId: string
  content: string
  createdAt: string | Date // ISO date or Date object
  updatedAt: string | Date // ISO date or Date object
}

/**
 * Prisma TaskAttachment type (from database)
 * Date can be Date object or ISO string
 */
export interface PrismaTaskAttachment {
  id: string
  taskId: string
  fileName: string
  fileSize: number
  fileType: string
  dataUrl: string
  uploadedAt: string | Date // ISO date or Date object
}

/**
 * Prisma TaskHistory type (from database)
 * Date can be Date object or ISO string
 */
export interface PrismaTaskHistory {
  id: string
  taskId: string
  field: string
  oldValue: string
  newValue: string
  changedAt: string | Date // ISO date or Date object
}

/**
 * Prisma Activity type (from database)
 * Date is ISO string (or Date object), metadata is JSON string
 */
export interface PrismaActivity {
  id: string
  taskId: string
  projectId: string | null
  type: string // Activity type as stored in database
  description: string
  metadata: string // JSON stringified object
  createdAt: string | Date // ISO date or Date object
}

/**
 * API request type for creating a project
 */
export interface CreateProjectRequest {
  name: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink'
  jiraKey?: string | null
}

/**
 * API request type for updating a project
 */
export interface UpdateProjectRequest {
  name?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink'
  jiraKey?: string | null
}

/**
 * API request type for creating a task
 */
export interface CreateTaskRequest {
  title: string
  description?: string
  status: 'backlog' | 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  projectId: string
  dueDate?: string | null // ISO date
  subcategory?: string | null
  jiraKey?: string | null
  storyPoints?: number | null
}

/**
 * API request type for updating a task
 */
export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: 'backlog' | 'todo' | 'in-progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null // ISO date
  subcategory?: string | null
  jiraKey?: string | null
  storyPoints?: number | null
  isArchived?: boolean
  archivedAt?: string | null // ISO date
  blockedBy?: string[] // Task IDs that block this task
  blocking?: string[] // Task IDs that this task blocks
}

/**
 * API request type for creating a time entry
 */
export interface CreateTimeEntryRequest {
  taskId: string
  hours: number
  minutes: number
  date: string // ISO date
  notes?: string
  type?: 'development' | 'meeting' | 'review' | 'research' | 'debugging' | 'other'
}

/**
 * API request type for updating a time entry
 */
export interface UpdateTimeEntryRequest {
  hours?: number
  minutes?: number
  date?: string // ISO date
  notes?: string
  type?: 'development' | 'meeting' | 'review' | 'research' | 'debugging' | 'other'
}

/**
 * API request type for creating a comment
 */
export interface CreateCommentRequest {
  taskId: string
  content: string
}

/**
 * API request type for updating a comment
 */
export interface UpdateCommentRequest {
  content: string
}

/**
 * API request type for creating an attachment
 */
export interface CreateAttachmentRequest {
  taskId: string
  fileName: string
  fileType: string
  dataUrl: string // base64 encoded
}

/**
 * API error response
 */
export interface APIErrorResponse {
  error: string
  status: number
  timestamp: string
}

/**
 * Generic API success response wrapper
 */
export interface APISuccessResponse<T> {
  data: T
  timestamp: string
}

/**
 * Transformation functions to convert between client and database types
 */

/**
 * Transform Prisma project to client project
 */
export const transformPrismaProjectToClient = (prismaProject: PrismaProject): Project => {
  return {
    id: prismaProject.id,
    name: prismaProject.name,
    color: prismaProject.color as any,
    subcategories: parseJSONField<string[]>(prismaProject.subcategories),
    createdAt: transformDateFromDB(prismaProject.createdAt),
    jiraKey: prismaProject.jiraKey,
  }
}

/**
 * Transform Prisma board to client board
 */
export const transformPrismaBoardToClient = (prismaBoard: PrismaBoard): Board => {
  return {
    id: prismaBoard.id,
    name: prismaBoard.name,
    projectId: prismaBoard.projectId,
    thumbnailPath: prismaBoard.thumbnailPath,
    content: prismaBoard.content,
    createdAt: transformDateFromDB(prismaBoard.createdAt),
    updatedAt: transformDateFromDB(prismaBoard.updatedAt),
    isArchived: prismaBoard.isArchived,
  }
}

/**
 * Transform client board to Prisma board
 */
export const transformClientBoardToPrisma = (clientBoard: Board): PrismaBoard => {
  return {
    id: clientBoard.id,
    name: clientBoard.name,
    projectId: clientBoard.projectId,
    thumbnailPath: clientBoard.thumbnailPath,
    content: clientBoard.content,
    createdAt: transformDateToDB(clientBoard.createdAt),
    updatedAt: transformDateToDB(clientBoard.updatedAt),
    isArchived: clientBoard.isArchived,
  }
}

/**
 * Transform Prisma task to client task
 */
export const transformPrismaTaskToClient = (prismaTask: PrismaTask): Task => {
  return {
    id: prismaTask.id,
    title: prismaTask.title,
    description: prismaTask.description,
    status: prismaTask.status as any,
    priority: prismaTask.priority as any,
    projectId: prismaTask.projectId,
    dueDate: transformDateFromDB(prismaTask.dueDate),
    subcategory: prismaTask.subcategory,
    jiraKey: prismaTask.jiraKey,
    storyPoints: prismaTask.storyPoints,
    createdAt: transformDateFromDB(prismaTask.createdAt),
    updatedAt: transformDateFromDB(prismaTask.updatedAt),
    completedAt: transformDateFromDB(prismaTask.completedAt),
    isArchived: prismaTask.isArchived,
    archivedAt: transformDateFromDB(prismaTask.archivedAt),
    blockedBy: parseJSONField<string[]>(prismaTask.blockedBy),
    blocking: parseJSONField<string[]>(prismaTask.blocking),
  }
}

/**
 * Transform Prisma time entry to client time entry
 */
export const transformPrismaTimeEntryToClient = (prismaEntry: PrismaTimeEntry): TimeEntry => {
  return {
    id: prismaEntry.id,
    taskId: prismaEntry.taskId,
    hours: prismaEntry.hours,
    minutes: prismaEntry.minutes,
    date: transformDateFromDB(prismaEntry.date),
    notes: prismaEntry.notes,
    type: prismaEntry.type as any,
    createdAt: transformDateFromDB(prismaEntry.createdAt),
  }
}

/**
 * Transform Prisma comment to client comment
 */
export const transformPrismaCommentToClient = (prismaComment: PrismaTaskComment): TaskComment => {
  return {
    id: prismaComment.id,
    taskId: prismaComment.taskId,
    content: prismaComment.content,
    createdAt: transformDateFromDB(prismaComment.createdAt),
    updatedAt: transformDateFromDB(prismaComment.updatedAt),
  }
}

/**
 * Transform Prisma attachment to client attachment
 */
export const transformPrismaAttachmentToClient = (prismaAttachment: PrismaTaskAttachment): TaskAttachment => {
  return {
    id: prismaAttachment.id,
    taskId: prismaAttachment.taskId,
    fileName: prismaAttachment.fileName,
    fileSize: prismaAttachment.fileSize,
    fileType: prismaAttachment.fileType,
    dataUrl: prismaAttachment.dataUrl,
    uploadedAt: transformDateFromDB(prismaAttachment.uploadedAt),
  }
}

/**
 * Transform Prisma history to client history
 */
export const transformPrismaHistoryToClient = (prismaHistory: PrismaTaskHistory): TaskHistory => {
  return {
    id: prismaHistory.id,
    taskId: prismaHistory.taskId,
    field: prismaHistory.field,
    oldValue: prismaHistory.oldValue,
    newValue: prismaHistory.newValue,
    changedAt: transformDateFromDB(prismaHistory.changedAt),
  }
}

/**
 * Transform Prisma activity to client activity
 */
export const transformPrismaActivityToClient = (prismaActivity: PrismaActivity): Activity => {
  return {
    id: prismaActivity.id,
    taskId: prismaActivity.taskId,
    type: prismaActivity.type as any,
    description: prismaActivity.description,
    metadata: parseJSONField<Record<string, unknown>>(prismaActivity.metadata),
    createdAt: transformDateFromDB(prismaActivity.createdAt),
  }
}
