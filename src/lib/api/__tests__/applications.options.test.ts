import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getApplicationOptions } from '../applications'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('getApplicationOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enforces authentication context and rejects unauthenticated callers', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Session not found'),
        }),
      },
    } as unknown as SupabaseClient

    await expect(getApplicationOptions(mockSupabase)).rejects.toThrow('Authentication failed')
  })

  it('queries only id, company_name, job_title, scopes by user_id, and orders by company_name ASC', async () => {
    const mockOptions = [
      { id: 'app-1', company_name: 'Alpha Corp', job_title: 'Frontend Engineer' },
      { id: 'app-2', company_name: 'Beta LLC', job_title: 'Fullstack Developer' },
    ]

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockOrder = vi
      .fn()
      .mockImplementation(() => Promise.resolve({ data: mockOptions, error: null }))

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        expect(table).toBe('applications')
        return {
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
        }
      }),
    } as unknown as SupabaseClient

    const result = await getApplicationOptions(mockSupabase)

    // 1. Returns exact shape with only id, company_name, job_title
    expect(result).toEqual(mockOptions)
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('company_name')
    expect(result[0]).toHaveProperty('job_title')
    expect(result[0]).not.toHaveProperty('notes')
    expect(result[0]).not.toHaveProperty('created_at')

    // 2. Selects only required columns
    expect(mockSelect).toHaveBeenCalledWith('id, company_name, job_title')

    // 3. Applies authenticated user ownership scoping
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')

    // 4. Orders alphabetically by company_name ASC
    expect(mockOrder).toHaveBeenCalledWith('company_name', { ascending: true })
  })

  it('uses explicitly passed userId when provided without redundant getUser call', async () => {
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockOrder = vi.fn().mockImplementation(() => Promise.resolve({ data: [], error: null }))

    const mockGetUser = vi.fn()
    const mockSupabase = {
      auth: {
        getUser: mockGetUser,
      },
      from: vi.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      })),
    } as unknown as SupabaseClient

    await getApplicationOptions(mockSupabase, 'custom-user-456')

    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('user_id', 'custom-user-456')
  })

  it('sanitizes database errors and does not leak raw PostgreSQL/Supabase internals', async () => {
    const rawPostgresError = {
      name: 'PostgresError',
      code: '42P01',
      message:
        'relation "applications" does not exist; SQL: SELECT id, company_name FROM applications WHERE user_id = $1',
      details: 'table missing on public schema',
      hint: 'check database migrations',
    }

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockOrder = vi
      .fn()
      .mockImplementation(() => Promise.resolve({ data: null, error: rawPostgresError }))

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      })),
    } as unknown as SupabaseClient

    // Expect the thrown error message to be sanitized
    await expect(getApplicationOptions(mockSupabase)).rejects.toThrow()

    try {
      await getApplicationOptions(mockSupabase)
    } catch (err: unknown) {
      const error = err as Error
      // Must NOT leak SQL or Postgres internal codes
      expect(error.message).not.toContain('relation "applications" does not exist')
      expect(error.message).not.toContain('42P01')
      expect(error.message).not.toContain('SELECT id, company_name')
      expect(error.message).not.toContain('table missing on public schema')
      // Must contain user-friendly sanitized text
      expect(error.message).toBe('Gagal memuat daftar opsi lamaran.')
    }
  })
})
