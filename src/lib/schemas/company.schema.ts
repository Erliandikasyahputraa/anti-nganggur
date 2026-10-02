import { z } from 'zod'

/**
 * Normalize a URL-ish field value before validation.
 *
 * Users commonly type bare domains ("fatninjas.com"). Zod's `z.string().url()`
 * requires a scheme, so we prepend `https://` when none is present. Empty,
 * null, and undefined values pass through untouched, values that already
 * carry a scheme (http://, https://, …) are returned as-is (trimmed), and
 * non-string values are returned untouched for the inner schema to reject.
 */
export function normalizeUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/**
 * Optional URL field that accepts bare domains by normalizing them first.
 */
const urlField = (message: string) =>
  z.preprocess(
    normalizeUrl,
    z.string().url(message).optional().nullable().or(z.literal(''))
  )

/**
 * Base company schema for form validation
 */
export const companyFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters'),

  website: urlField('Must be a valid URL'),

  industry: z
    .string()
    .max(255, 'Industry must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  location: z
    .string()
    .max(255, 'Location must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  linkedin_url: urlField('Must be a valid URL'),

  github_url: urlField('Must be a valid URL'),

  overview: z
    .string()
    .max(10000, 'Overview must be less than 10000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
})

/**
 * Schema for creating a new company (insert)
 */
export const createCompanySchema = companyFormSchema.extend({
  user_id: z.string().uuid('Invalid user ID').optional(),
})

/**
 * Schema for updating an existing company
 */
export const updateCompanySchema = companyFormSchema.partial()

/**
 * Type exports inferred from schemas
 */
export type CompanyFormData = z.infer<typeof companyFormSchema>
export type CreateCompanyData = z.infer<typeof createCompanySchema>
export type UpdateCompanyData = z.infer<typeof updateCompanySchema>
