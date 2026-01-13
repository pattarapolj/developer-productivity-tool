/**
 * Analytics utility functions for trend analysis, moving averages, and linear regression
 */

export interface DataPoint {
  value: number
  index?: number
}

export interface TrendResult {
  direction: 'up' | 'down' | 'stable'
  slope: number
  percentage: number
}

/**
 * Calculate moving average for a dataset
 * @param data - Array of data points (numbers or objects with value property)
 * @param windowSize - Size of the moving average window (e.g., 3, 7, 14)
 * @returns Array of moving average values (null for points without enough data)
 */
export function calculateMovingAverage(
  data: number[] | DataPoint[],
  windowSize: number
): (number | null)[] {
  if (windowSize <= 0) throw new Error('Window size must be positive')
  if (data.length === 0) return []

  // Extract values if data is array of objects
  const values = data.map(d => typeof d === 'number' ? d : d.value)

  return values.map((_, index) => {
    if (index < windowSize - 1) return null // Not enough data points

    const window = values.slice(index - windowSize + 1, index + 1)
    const sum = window.reduce((acc, val) => acc + val, 0)
    return Math.round((sum / windowSize) * 100) / 100 // Round to 2 decimals
  })
}

/**
 * Calculate trend line using linear regression (least squares method)
 * @param data - Array of data points (numbers or objects with value property)
 * @returns Trend result with direction, slope, and percentage change
 */
export function calculateTrendLine(data: number[] | DataPoint[]): TrendResult {
  if (data.length === 0) {
    return { direction: 'stable', slope: 0, percentage: 0 }
  }

  // Extract values if data is array of objects
  const values = data.map(d => typeof d === 'number' ? d : d.value)

  if (values.length === 1) {
    return { direction: 'stable', slope: 0, percentage: 0 }
  }

  // Linear regression: y = mx + b
  const n = values.length
  const indices = values.map((_, i) => i)

  const sumX = indices.reduce((sum, x) => sum + x, 0)
  const sumY = values.reduce((sum, y) => sum + y, 0)
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0)
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0)

  // Calculate slope (m)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

  // Calculate percentage change from first to last value
  const firstValue = values[0]
  const lastValue = values[n - 1]
  const percentage = firstValue !== 0 
    ? Math.round(((lastValue - firstValue) / firstValue) * 100) 
    : 0

  // Determine direction based on slope threshold
  const direction = Math.abs(slope) < 0.1 ? 'stable' : slope > 0 ? 'up' : 'down'

  return {
    direction,
    slope: Math.round(slope * 100) / 100,
    percentage,
  }
}

/**
 * Get trend line coordinates for charting
 * @param data - Array of data points
 * @returns Array of {x, y} coordinates for the trend line
 */
export function getTrendLineCoordinates(data: number[] | DataPoint[]): Array<{x: number, y: number}> {
  if (data.length === 0) return []

  const values = data.map(d => typeof d === 'number' ? d : d.value)
  const n = values.length
  const indices = values.map((_, i) => i)

  const sumX = indices.reduce((sum, x) => sum + x, 0)
  const sumY = values.reduce((sum, y) => sum + y, 0)
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0)
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate trend line points
  return indices.map(x => ({
    x,
    y: Math.round((slope * x + intercept) * 100) / 100,
  }))
}
