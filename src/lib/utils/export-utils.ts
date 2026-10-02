import type { Application, CustomColumnDB } from '@/lib/types/database.types'

export function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  if (
    stringValue.includes('"') ||
    stringValue.includes(',') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    const escaped = stringValue.replace(/"/g, '""')
    return `"${escaped}"`
  }

  return stringValue
}

export function generateApplicationsCSV(
  applications: Application[],
  customColumns: CustomColumnDB[]
): string {
  if (applications.length === 0) {
    return ''
  }

  const columnMap = new Map<string, string>()
  for (const col of customColumns) {
    columnMap.set(col.id, col.name)
  }

  const headers = [
    'ID',
    'Company Name',
    'Job Title',
    'Job Description',
    'Status',
    'Custom Column ID',
    'Custom Column Name',
    'Date Applied',
    'Location',
    'Salary Range',
    'Job URL',
    'Company Logo URL',
    'Source',
    'Notes',
    'Position',
    'Created At',
    'Updated At',
  ]

  const rows = applications.map(app => {
    const customColumnName = app.custom_column_id ? columnMap.get(app.custom_column_id) || '' : ''

    return [
      app.id,
      app.company_name,
      app.job_title,
      app.job_description,
      app.status,
      app.custom_column_id,
      customColumnName,
      app.date_applied,
      app.location,
      app.salary_range,
      app.job_url,
      app.company_logo_url,
      app.source,
      app.notes,
      app.position,
      app.created_at,
      app.updated_at,
    ]
  })

  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(',')),
  ].join('\r\n')

  return '\uFEFF' + csvContent
}

export function generateFilename(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `anti-nganggur-applications-${year}-${month}-${day}.csv`
}

export function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
