import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getApplications,
  getDashboardApplications,
  DASHBOARD_APPLICATIONS_PROJECTION,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationsByStatus,
} from '../applications'
import type {
  Application,
  ApplicationInsert,
  DashboardApplication,
} from '@/lib/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockApplications: Application[] = [
  {
    id: '1',
    user_id: 'user-1',
    company_name: 'Tech Corp',
    company_id: null,
    job_title: 'Software Engineer',
    status: 'applied',
    job_url: 'https://techcorp.com/jobs/123',
    location: 'San Francisco, CA',
    salary_range: '$120k - $180k',
    notes: 'Great company culture',
    date_applied: '2025-10-01',
    position: 1,
    custom_column_id: null,
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
]

const mockDashboardApplications: DashboardApplication[] = [
  {
    id: '1',
    company_name: 'Tech Corp',
    job_title: 'Software Engineer',
    status: 'applied',
    date_applied: '2025-10-01',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
]

// Create mock Supabase client
const createMockSupabaseClient = (options?: {
  mockData?: { data: unknown; error: unknown }
  user?: { id: string } | null
  authError?: unknown
}) => {
  const queryResult = options?.mockData ?? {
    data: mockApplications,
    error: null,
  }

  const mockSingleData = {
    data: mockApplications[0],
    error: null,
  }

  let lastBuilder: {
    select: ReturnType<typeof vi.fn>
    order: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    single: ReturnType<typeof vi.fn>
    insert: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  } | null = null

  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(mockSingleData),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      // Make the query builder thenable so it can be awaited
      then: (resolve: (value: typeof queryResult) => void) => {
        resolve(queryResult)
      },
    }
    lastBuilder = builder
    return builder
  }

  return {
    from: vi.fn(() => createQueryBuilder()),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options?.user !== undefined ? options?.user : { id: 'user-1' } },
        error: options?.authError ?? null,
      }),
    },
    getLastBuilder: () => lastBuilder,
  }
}

describe('Applications API', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  describe('getApplications', () => {
    it('should fetch all applications', async () => {
      const result = await getApplications(mockSupabase as unknown as SupabaseClient)
      expect(result).toEqual(mockApplications)
    })
  })

  describe('getDashboardApplications', () => {
    it('should use exact projection string, user_id filter, and created_at DESC ordering', async () => {
      const client = createMockSupabaseClient({
        mockData: { data: mockDashboardApplications, error: null },
      })

      const result = await getDashboardApplications(client as unknown as SupabaseClient)

      expect(DASHBOARD_APPLICATIONS_PROJECTION).toBe(
        'id, company_name, job_title, status, date_applied, created_at, updated_at'
      )
      expect(client.from).toHaveBeenCalledWith('applications')

      const builder = client.getLastBuilder()
      expect(builder?.select).toHaveBeenCalledWith(DASHBOARD_APPLICATIONS_PROJECTION)
      expect(builder?.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(builder?.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockDashboardApplications)
    })

    it('should support passing explicit verified userId', async () => {
      const client = createMockSupabaseClient({
        mockData: { data: mockDashboardApplications, error: null },
      })

      const result = await getDashboardApplications(client as unknown as SupabaseClient, 'user-123')
      const builder = client.getLastBuilder()
      expect(builder?.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toEqual(mockDashboardApplications)
    })

    it('should throw an error when authentication context verification fails with authError', async () => {
      const client = createMockSupabaseClient({
        user: null,
        authError: { message: 'JWT expired' },
      })

      await expect(getDashboardApplications(client as unknown as SupabaseClient)).rejects.toThrow(
        /Authentication failed: JWT expired/
      )
    })

    it('should throw an error when no authenticated user is found', async () => {
      const client = createMockSupabaseClient({
        user: null,
        authError: null,
      })

      await expect(getDashboardApplications(client as unknown as SupabaseClient)).rejects.toThrow(
        /No authenticated user found/
      )
    })

    it('should handle query failure and throw descriptive error', async () => {
      const client = createMockSupabaseClient({
        mockData: { data: null, error: { message: 'Database connection failed' } },
      })

      await expect(getDashboardApplications(client as unknown as SupabaseClient)).rejects.toThrow(
        'Failed to fetch dashboard applications: Database connection failed'
      )
    })

    it('should handle permission denied error with specific diagnostic message', async () => {
      const client = createMockSupabaseClient({
        mockData: { data: null, error: { message: 'permission denied for table applications' } },
      })

      await expect(getDashboardApplications(client as unknown as SupabaseClient)).rejects.toThrow(
        /Permission denied accessing applications table/
      )
    })

    it('should return an empty array if data is null without error', async () => {
      const client = createMockSupabaseClient({
        mockData: { data: null, error: null },
      })

      const result = await getDashboardApplications(client as unknown as SupabaseClient)
      expect(result).toEqual([])
    })
  })

  describe('getApplication', () => {
    it('should fetch a single application by id', async () => {
      const result = await getApplication(mockSupabase as unknown as SupabaseClient, '1')
      expect(result).toEqual(mockApplications[0])
    })
  })

  describe('createApplication', () => {
    it('should create a new application', async () => {
      const newApplication: ApplicationInsert = {
        company_name: 'Test Co',
        company_id: null,
        job_title: 'Developer',
        status: 'wishlist',
        job_url: null,
        location: null,
        salary_range: null,
        notes: null,
        date_applied: new Date().toISOString().split('T')[0],
        position: 1,
        custom_column_id: null,
      }

      const result = await createApplication(
        mockSupabase as unknown as SupabaseClient,
        newApplication
      )
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })
  })

  describe('updateApplication', () => {
    it('should update an existing application', async () => {
      const updates = {
        status: 'phone_screen' as const,
        notes: 'Phone screen scheduled',
      }

      const result = await updateApplication(
        mockSupabase as unknown as SupabaseClient,
        '1',
        updates
      )
      expect(result).toBeDefined()
    })
  })

  describe('deleteApplication', () => {
    it('should delete an application', async () => {
      await expect(
        deleteApplication(mockSupabase as unknown as SupabaseClient, '1')
      ).resolves.toBeUndefined()
    })
  })

  describe('getApplicationsByStatus', () => {
    it('should fetch applications by status', async () => {
      const result = await getApplicationsByStatus(
        mockSupabase as unknown as SupabaseClient,
        'applied'
      )
      expect(result).toEqual(mockApplications)
    })
  })
})
