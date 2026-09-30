'use client'

import * as React from 'react'
import type { TaskWithApplication, TaskPriority } from '@/lib/types/database.types'
import type { ApplicationOption } from '@/lib/api/applications'
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/schemas/task.schema'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>
  initialData?: TaskWithApplication | null
  applicationOptions: ApplicationOption[]
  isSubmitting?: boolean
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  applicationOptions,
  isSubmitting = false,
}: TaskFormModalProps) {
  const isEditing = Boolean(initialData)

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = React.useState('')
  const [applicationId, setApplicationId] = React.useState('')
  const [errors, setErrors] = React.useState<{ title?: string }>({})

  // Synchronize form fields whenever initialData or isOpen changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setPriority(initialData.priority || 'medium')
        setDueDate(initialData.due_date || '')
        setApplicationId(initialData.application_id || '')
      } else {
        setTitle('')
        setDescription('')
        setPriority('medium')
        setDueDate('')
        setApplicationId('')
      }
      setErrors({})
    }
  }, [isOpen, initialData])

  const validateForm = () => {
    const trimmedTitle = title.trim()
    const newErrors: { title?: string } = {}

    if (!trimmedTitle) {
      newErrors.title = 'Judul tugas wajib diisi'
    } else if (trimmedTitle.length > 255) {
      newErrors.title = 'Judul tugas tidak boleh melebihi 255 karakter'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || isSubmitting) {
      return
    }

    const payload: CreateTaskInput = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      priority,
      due_date: dueDate || null,
      application_id: applicationId || null,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch {
      // Error handling is handled by the caller/toast
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !isSubmitting && !open && onClose()}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border shadow-2xl rounded-2xl p-5 sm:p-6"
        data-testid="task-form-modal"
      >
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle
            className="text-lg sm:text-xl font-bold text-label-primary tracking-tight"
            data-testid="task-form-modal-title"
          >
            {isEditing ? 'Edit Tugas' : 'Tambah Tugas Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-label-secondary">
            {isEditing
              ? 'Perbarui detail tugas atau sesuaikan tenggat waktu Anda.'
              : 'Buat catatan tugas baru untuk memantau progres pencarian kerja Anda.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
          {/* 1. Title Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="task-title"
              className="text-xs sm:text-sm font-semibold text-label-primary"
            >
              Judul Tugas <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task-title"
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }))
              }}
              placeholder="Contoh: Follow up email HR recruiter"
              maxLength={255}
              disabled={isSubmitting}
              className={`min-h-[44px] text-sm ${
                errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              data-testid="task-form-title-input"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'task-title-error' : undefined}
            />
            {errors.title && (
              <p
                id="task-title-error"
                className="text-xs text-red-500 font-medium"
                data-testid="task-title-error"
              >
                {errors.title}
              </p>
            )}
          </div>

          {/* 2. Description Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="task-description"
              className="text-xs sm:text-sm font-semibold text-label-primary"
            >
              Deskripsi <span className="text-label-tertiary font-normal">(Opsional)</span>
            </Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tambahkan detail, link, atau catatan persiapan..."
              rows={3}
              maxLength={2000}
              disabled={isSubmitting}
              className="min-h-[80px] text-sm resize-none"
              data-testid="task-form-desc-input"
            />
          </div>

          {/* 3. Priority and Due Date in 2 columns on larger screens, 1 col on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1.5">
              <Label
                htmlFor="task-priority"
                className="text-xs sm:text-sm font-semibold text-label-primary"
              >
                Prioritas
              </Label>
              <select
                id="task-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                disabled={isSubmitting}
                className="flex min-h-[44px] w-full rounded-md border border-input bg-[var(--surface-input)] px-3 py-2 text-sm text-foreground shadow-xs transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="task-form-priority-select"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High)</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label
                htmlFor="task-due-date"
                className="text-xs sm:text-sm font-semibold text-label-primary"
              >
                Tenggat Waktu <span className="text-label-tertiary font-normal">(Opsional)</span>
              </Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[44px] text-sm"
                data-testid="task-form-duedate-input"
              />
            </div>
          </div>

          {/* 4. Application Association */}
          <div className="space-y-1.5">
            <Label
              htmlFor="task-application"
              className="text-xs sm:text-sm font-semibold text-label-primary"
            >
              Tautkan ke Lamaran <span className="text-label-tertiary font-normal">(Opsional)</span>
            </Label>
            <select
              id="task-application"
              value={applicationId}
              onChange={e => setApplicationId(e.target.value)}
              disabled={isSubmitting}
              className="flex min-h-[44px] w-full rounded-md border border-input bg-[var(--surface-input)] px-3 py-2 text-sm text-foreground shadow-xs transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 truncate"
              data-testid="task-form-app-select"
            >
              <option value="">Tanpa Lamaran (Tugas Mandiri)</option>
              {applicationOptions.map(app => (
                <option key={app.id} value={app.id}>
                  {app.company_name} — {app.job_title}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] w-full sm:w-auto touch-manipulation"
              data-testid="task-form-cancel-btn"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] w-full sm:w-auto touch-manipulation gap-2 shadow-xs"
              data-testid="task-form-submit-btn"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Tugas'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
