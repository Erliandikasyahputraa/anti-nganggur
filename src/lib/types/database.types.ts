export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'phone_screen'
  | 'assessment'
  | 'take_home'
  | 'interviewing'
  | 'final_round'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted'

export interface Application {
  id: string
  user_id: string
  company_name: string
  company_id: string | null
  job_title: string
  job_url: string | null
  location: string | null
  salary_range: string | null
  job_description?: string | null
  company_logo_url?: string | null
  source?: string | null
  status: ApplicationStatus
  custom_column_id: string | null
  date_applied: string
  notes: string | null
  position: number
  created_at: string
  updated_at: string
}

export type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at' | 'user_id'>
export type ApplicationUpdate = Partial<Omit<Application, 'id' | 'user_id'>>

export interface CompanyDB {
  id: string
  user_id: string
  name: string
  website: string | null
  industry: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  overview: string | null
  created_at: string
  updated_at: string
}

export type CompanyInsert = Omit<CompanyDB, 'id' | 'created_at' | 'updated_at' | 'user_id'>
export type CompanyUpdate = Partial<Omit<CompanyDB, 'id' | 'created_at' | 'updated_at' | 'user_id'>>

export interface CustomColumnDB {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string | null
  order: number
  created_at: string
  updated_at: string
}

export type CustomColumnInsert = Omit<
  CustomColumnDB,
  'id' | 'created_at' | 'updated_at' | 'user_id'
>
export type CustomColumnUpdate = Partial<
  Omit<CustomColumnDB, 'id' | 'created_at' | 'updated_at' | 'user_id'>
>

export type DocumentType = 'resume' | 'cover_letter' | 'attachment'

export interface ApplicationDocumentDB {
  id: string
  user_id: string
  application_id: string
  name: string
  document_type: DocumentType
  storage_path: string
  mime_type: string
  size_bytes: number
  created_at: string
  updated_at: string
}

export type ApplicationDocumentInsert = Omit<
  ApplicationDocumentDB,
  'id' | 'created_at' | 'updated_at' | 'user_id'
>

export type ApplicationDocumentUpdate = Partial<
  Omit<ApplicationDocumentDB, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'application_id'>
>

export interface ApplicationStatusHistoryDB {
  id: string
  application_id: string
  user_id: string
  from_status: ApplicationStatus | null
  to_status: ApplicationStatus
  from_custom_column_id: string | null
  to_custom_column_id: string | null
  created_at: string
}

export type ApplicationStatusHistoryInsert = Omit<
  ApplicationStatusHistoryDB,
  'id' | 'created_at' | 'user_id'
>

export type TaskStatus = 'pending' | 'completed'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface TaskDB {
  id: string
  user_id: string
  application_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskInsert = {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
  completed_at?: string | null
  application_id?: string | null
  user_id?: string
}

export type TaskUpdate = Partial<Omit<TaskDB, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export interface TaskWithApplication extends TaskDB {
  application?: {
    id: string
    job_title: string
    company_name: string
  } | null
}
