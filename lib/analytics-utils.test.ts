import { describe, it, expect } from 'vitest'
import { calculateMovingAverage, calculateTrendLine, getTrendLineCoordinates } from './analytics-utils'
import type { DataPoint } from './analytics-utils'

describe('Analytics Utils', () => {
  describe('calculateMovingAverage', () => {
    it('should calculate 3-period moving average', () => {
      const data = [1, 2, 3, 4, 5, 6]
      const result = calculateMovingAverage(data, 3)
      
      expect(result).toEqual([
        null, // Not enough data
        null, // Not enough data
        2,    // (1 + 2 + 3) / 3 = 2
        3,    // (2 + 3 + 4) / 3 = 3
        4,    // (3 + 4 + 5) / 3 = 4
        5,    // (4 + 5 + 6) / 3 = 5
      ])
    })

    it('should calculate 7-period moving average', () => {
      const data = [10, 20, 30, 40, 50, 60, 70, 80]
      const result = calculateMovingAverage(data, 7)
      
      expect(result[6]).toBe(40) // (10+20+30+40+50+60+70) / 7 = 40
      expect(result[7]).toBe(50) // (20+30+40+50+60+70+80) / 7 = 50
    })

    it('should handle array of objects with value property', () => {
      const data: DataPoint[] = [
        { value: 10 },
        { value: 20 },
        { value: 30 },
      ]
      const result = calculateMovingAverage(data, 2)
      
      expect(result).toEqual([null, 15, 25])
    })

    it('should return nulls when window size is larger than data', () => {
      const data = [1, 2, 3]
      const result = calculateMovingAverage(data, 5)
      
      expect(result).toEqual([null, null, null])
    })

    it('should handle empty array', () => {
      const result = calculateMovingAverage([], 3)
      expect(result).toEqual([])
    })

    it('should throw error for invalid window size', () => {
      expect(() => calculateMovingAverage([1, 2, 3], 0)).toThrow('Window size must be positive')
      expect(() => calculateMovingAverage([1, 2, 3], -1)).toThrow('Window size must be positive')
    })

    it('should handle window size of 1', () => {
      const data = [5, 10, 15]
      const result = calculateMovingAverage(data, 1)
      
      expect(result).toEqual([5, 10, 15])
    })

    it('should round to 2 decimal places', () => {
      const data = [1, 2, 4]
      const result = calculateMovingAverage(data, 3)
      
      expect(result[2]).toBe(2.33) // (1 + 2 + 4) / 3 = 2.333...
    })
  })

  describe('calculateTrendLine', () => {
    it('should detect upward trend', () => {
      const data = [1, 2, 3, 4, 5]
      const result = calculateTrendLine(data)
      
      expect(result.direction).toBe('up')
      expect(result.slope).toBeGreaterThan(0)
      expect(result.percentage).toBe(400) // (5-1)/1 * 100 = 400%
    })

    it('should detect downward trend', () => {
      const data = [10, 8, 6, 4, 2]
      const result = calculateTrendLine(data)
      
      expect(result.direction).toBe('down')
      expect(result.slope).toBeLessThan(0)
      expect(result.percentage).toBe(-80) // (2-10)/10 * 100 = -80%
    })

    it('should detect stable trend for flat data', () => {
      const data = [5, 5, 5, 5, 5]
      const result = calculateTrendLine(data)
      
      expect(result.direction).toBe('stable')
      expect(result.slope).toBe(0)
      expect(result.percentage).toBe(0)
    })

    it('should detect stable trend for slight variations', () => {
      const data = [10, 10.05, 9.95, 10, 10.02]
      const result = calculateTrendLine(data)
      
      // Slope should be very small, considered stable
      expect(result.direction).toBe('stable')
      expect(Math.abs(result.slope)).toBeLessThan(0.1)
    })

    it('should handle array of objects with value property', () => {
      const data: DataPoint[] = [
        { value: 2 },
        { value: 4 },
        { value: 6 },
        { value: 8 },
      ]
      const result = calculateTrendLine(data)
      
      expect(result.direction).toBe('up')
      expect(result.slope).toBeGreaterThan(0)
    })

    it('should handle empty array', () => {
      const result = calculateTrendLine([])
      
      expect(result).toEqual({
        direction: 'stable',
        slope: 0,
        percentage: 0,
      })
    })

    it('should handle single data point', () => {
      const result = calculateTrendLine([10])
      
      expect(result).toEqual({
        direction: 'stable',
        slope: 0,
        percentage: 0,
      })
    })

    it('should calculate correct slope for linear data', () => {
      const data = [0, 2, 4, 6, 8] // Perfect slope of 2
      const result = calculateTrendLine(data)
      
      expect(result.slope).toBe(2)
      expect(result.direction).toBe('up')
    })

    it('should handle zero as first value in percentage calculation', () => {
      const data = [0, 1, 2, 3]
      const result = calculateTrendLine(data)
      
      expect(result.percentage).toBe(0) // Cannot calculate percentage from 0
    })

    it('should calculate negative percentage correctly', () => {
      const data = [100, 80, 60, 40, 20]
      const result = calculateTrendLine(data)
      
      expect(result.percentage).toBe(-80) // (20-100)/100 * 100 = -80%
    })
  })

  describe('getTrendLineCoordinates', () => {
    it('should generate trend line coordinates for upward trend', () => {
      const data = [1, 2, 3, 4, 5]
      const coords = getTrendLineCoordinates(data)
      
      expect(coords).toHaveLength(5)
      expect(coords[0].x).toBe(0)
      expect(coords[4].x).toBe(4)
      
      // For linear data, trend line should match closely
      expect(coords[0].y).toBeCloseTo(1, 0)
      expect(coords[4].y).toBeCloseTo(5, 0)
    })

    it('should generate trend line coordinates for downward trend', () => {
      const data = [10, 8, 6, 4, 2]
      const coords = getTrendLineCoordinates(data)
      
      expect(coords).toHaveLength(5)
      // First coordinate should be near 10
      expect(coords[0].y).toBeCloseTo(10, 0)
      // Last coordinate should be near 2
      expect(coords[4].y).toBeCloseTo(2, 0)
    })

    it('should generate flat line for stable data', () => {
      const data = [5, 5, 5, 5]
      const coords = getTrendLineCoordinates(data)
      
      expect(coords).toHaveLength(4)
      coords.forEach(coord => {
        expect(coord.y).toBeCloseTo(5, 0)
      })
    })

    it('should handle empty array', () => {
      const coords = getTrendLineCoordinates([])
      expect(coords).toEqual([])
    })

    it('should handle array of objects', () => {
      const data: DataPoint[] = [
        { value: 2 },
        { value: 4 },
        { value: 6 },
      ]
      const coords = getTrendLineCoordinates(data)
      
      expect(coords).toHaveLength(3)
      expect(coords[0].y).toBeCloseTo(2, 0)
      expect(coords[2].y).toBeCloseTo(6, 0)
    })

    it('should round y values to 2 decimal places', () => {
      const data = [1, 2, 4] // Creates non-integer trend line
      const coords = getTrendLineCoordinates(data)
      
      coords.forEach(coord => {
        // Check that values are rounded to 2 decimals
        expect(coord.y).toBe(Math.round(coord.y * 100) / 100)
      })
    })
  })
})
