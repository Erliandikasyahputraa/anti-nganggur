import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { escapeCSVField, generateApplicationsCSV, generateFilename } from '../export-utils'
import type { Application, CustomColumnDB } from '@/lib/types/database.types'

describe('Export Utils', () => {
  describe('escapeCSVField', () => {
    it('returns empty string for null or undefined', () => {
      expect(escapeCSVField(null)).toBe('')
      expect(escapeCSVField(undefined)).toBe('')
    })

    it('returns standard strings as is', () => {
      expect(escapeCSVField('hello')).toBe('hello')
      expect(escapeCSVField('123')).toBe('123')
    })

    it('wraps fields containing commas in quotes', () => {
      expect(escapeCSVField('hello, world')).toBe('"hello, world"')
    })

    it('wraps fields containing quotes in quotes and escapes internal quotes', () => {
      expect(escapeCSVField('hello "world"')).toBe('"hello ""world"""')
    })

    it('wraps fields containing newlines in quotes', () => {
      expect(escapeCSVField('hello\nworld')).toBe('"hello\nworld"')
      expect(escapeCSVField('hello\r\nworld')).toBe('"hello\r\nworld"')
    })

    it('handles unicode characters correctly without escaping', () => {
      expect(escapeCSVField('Café☕')).toBe('Café☕')
    })
  })

  describe('generateApplicationsCSV', () => {
    const mockColumns: CustomColumnDB[] = [
      {
        id: 'col-1',
        user_id: 'user-1',
        name: 'Urgent',
        description: null,
        icon: null,
        order: 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]

    const mockApplications: Application[] = [
      {
        id: 'app-1',
        user_id: 'user-1',
        company_name: 'ACME, Inc.',
        company_id: null,
        job_title: 'Software Engineer',
        job_url: 'https://example.com?foo=bar',
        location: 'Remote',
        salary_range: null,
        job_description: 'We are looking for a "Ninja" developer, with 10 years experience.',
        company_logo_url: null,
        source: null,
        status: 'applied',
        custom_column_id: 'col-1',
        date_applied: '2026-01-01',
        notes: 'Line 1\nLine 2',
        position: 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'app-2',
        user_id: 'user-1',
        company_name: 'Regular Company',
        company_id: null,
        job_title: 'Product Manager',
        job_url: null,
        location: null,
        salary_range: null,
        job_description: null,
        company_logo_url: null,
        source: null,
        status: 'wishlist',
        custom_column_id: null,
        date_applied: '2026-01-02',
        notes: null,
        position: 1,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    ]

    it('returns empty string if applications array is empty', () => {
      expect(generateApplicationsCSV([], mockColumns)).toBe('')
    })

    it('includes a UTF-8 BOM at the start of the string', () => {
      const result = generateApplicationsCSV(mockApplications, mockColumns)
      expect(result.startsWith('\uFEFF')).toBe(true)
    })

    it('generates correct headers', () => {
      const result = generateApplicationsCSV(mockApplications, mockColumns)
      const lines = result.split('\r\n')
      expect(lines[0].replace('\uFEFF', '')).toBe(
        'ID,Company Name,Job Title,Job Description,Status,Custom Column ID,Custom Column Name,Date Applied,Location,Salary Range,Job URL,Company Logo URL,Source,Notes,Position,Created At,Updated At'
      )
    })

    it('correctly maps custom columns and escapes complex fields', () => {
      const result = generateApplicationsCSV(mockApplications, mockColumns)
      const lines = result.split('\r\n')

      // Expected output for app-1:
      // company_name has comma -> "ACME, Inc."
      // job_description has quotes and comma -> "We are looking for a ""Ninja"" developer, with 10 years experience."
      // custom_column is 'Urgent'
      // notes has newline -> "Line 1\nLine 2"

      const app1Line = lines[1]
      expect(app1Line).toContain('"ACME, Inc."')
      expect(app1Line).toContain('col-1') // raw custom column id
      expect(app1Line).toContain('Urgent') // custom column mapped
      expect(app1Line).toContain('"Line 1\nLine 2"')
      expect(app1Line).toContain(
        '"We are looking for a ""Ninja"" developer, with 10 years experience."'
      )
    })

    it('correctly handles null custom columns and null notes', () => {
      const result = generateApplicationsCSV(mockApplications, mockColumns)
      const lines = result.split('\r\n')

      // Expected output for app-2:
      // custom_column_id is empty
      // custom_column_name is empty
      // notes is empty
      // job_description is empty

      const app2Line = lines[2]
      // Split by non-escaped commas (since app2 has no commas in values, split(',') is safe enough for testing)
      const fields = app2Line.split(',')
      expect(fields[1]).toBe('Regular Company')
      expect(fields[3]).toBe('') // Job Description
      expect(fields[5]).toBe('') // Custom Column ID
      expect(fields[6]).toBe('') // Custom Column Name
      expect(fields[13]).toBe('') // Notes
    })
  })

  describe('generateFilename', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-08-25T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('generates filename with correct date format', () => {
      expect(generateFilename()).toBe('anti-nganggur-applications-2026-08-25.csv')
    })
  })
})
