import { describe, expect, it } from 'vitest'
import {
  companyFormSchema,
  createCompanySchema,
  normalizeUrl,
} from '../company.schema'

describe('normalizeUrl', () => {
  it('prepends https:// to bare domains', () => {
    expect(normalizeUrl('fatninjas.com')).toBe('https://fatninjas.com')
    expect(normalizeUrl('bnpparibas.co.id')).toBe('https://bnpparibas.co.id')
    expect(normalizeUrl('linkedin.com/company/acme')).toBe(
      'https://linkedin.com/company/acme'
    )
  })

  it('leaves values that already carry a scheme untouched', () => {
    expect(normalizeUrl('https://fatninjas.com')).toBe('https://fatninjas.com')
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('leaves empty, null, and undefined untouched', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl(null)).toBeNull()
    expect(normalizeUrl(undefined)).toBeUndefined()
  })

  it('trims surrounding whitespace before normalizing', () => {
    expect(normalizeUrl('  fatninjas.com  ')).toBe('https://fatninjas.com')
  })

  it('passes non-string values through for the schema to reject', () => {
    expect(normalizeUrl(123)).toBe(123)
  })
})

describe('companyFormSchema URL fields', () => {
  const base = { name: 'Acme' }

  it('accepts bare domains for website, linkedin_url, and github_url', () => {
    const result = companyFormSchema.safeParse({
      ...base,
      website: 'fatninjas.com',
      linkedin_url: 'linkedin.com/company/acme',
      github_url: 'github.com/acme',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.website).toBe('https://fatninjas.com')
      expect(result.data.linkedin_url).toBe('https://linkedin.com/company/acme')
      expect(result.data.github_url).toBe('https://github.com/acme')
    }
  })

  it('keeps fully qualified URLs unchanged', () => {
    const result = companyFormSchema.safeParse({
      ...base,
      website: 'https://ciheul.com',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.website).toBe('https://ciheul.com')
    }
  })

  it('still accepts empty strings', () => {
    const result = companyFormSchema.safeParse({ ...base, website: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.website).toBe('')
    }
  })

  it('still rejects values that are not URL-like after normalization', () => {
    const result = companyFormSchema.safeParse({
      ...base,
      website: 'not a url',
    })
    expect(result.success).toBe(false)
  })

  it('still requires a company name', () => {
    const result = companyFormSchema.safeParse({ ...base, name: '' })
    expect(result.success).toBe(false)
  })
})

describe('createCompanySchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createCompanySchema.safeParse({ name: 'TEST Debug Company' })
    expect(result.success).toBe(true)
  })

  it('accepts a bare-domain website on the create path', () => {
    const result = createCompanySchema.safeParse({
      name: 'FatNinjas Indonesia',
      website: 'fatninjas.com',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.website).toBe('https://fatninjas.com')
    }
  })
})
