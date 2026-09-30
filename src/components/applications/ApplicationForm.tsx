'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { type ApplicationFormData, type ApplicationStatus } from '@/lib/schemas/application.schema'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// Define a form-friendly version of the schema that works better with React Hook Form
const formSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters'),
  job_title: z
    .string()
    .min(1, 'Job title is required')
    .max(255, 'Job title must be less than 255 characters'),
  job_url: z.string().url('Must be a valid URL').or(z.literal('')),
  location: z.string().max(255, 'Location must be less than 255 characters'),
  salary_range: z.string().max(100, 'Salary range must be less than 100 characters'),
  status: z.enum([
    'wishlist',
    'applied',
    'phone_screen',
    'assessment',
    'take_home',
    'interviewing',
    'final_round',
    'offered',
    'accepted',
    'rejected',
    'withdrawn',
    'ghosted',
  ]),
  date_applied: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().max(5000, 'Notes must be less than 5000 characters'),
})

type FormData = z.infer<typeof formSchema>

interface ApplicationFormProps {
  onSubmit: (_data: ApplicationFormData) => void
  onCancel?: () => void
  initialData?: Partial<ApplicationFormData>
  isLoading?: boolean
  submitButtonText?: string
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'take_home', label: 'Take Home' },
  { value: 'interviewing', label: 'Interview' },
  { value: 'final_round', label: 'Final Round' },
  { value: 'offered', label: 'Offered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'ghosted', label: 'Ghosted' },
]

export default function ApplicationForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  submitButtonText = 'Submit Application',
}: ApplicationFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: initialData?.company_name ?? '',
      job_title: initialData?.job_title ?? '',
      job_url: initialData?.job_url ?? '',
      location: initialData?.location ?? '',
      salary_range: initialData?.salary_range ?? '',
      status: initialData?.status ?? 'wishlist',
      date_applied: initialData?.date_applied ?? new Date().toISOString().split('T')[0],
      notes: initialData?.notes ?? '',
    },
  })

  const handleSubmit = (data: FormData) => {
    // Cast to ApplicationFormData - the types are compatible
    onSubmit(data as unknown as ApplicationFormData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Company Name */}
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="font-semibold text-foreground">
                  Company Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Google, Microsoft, Acme Inc."
                    required
                    disabled={isLoading}
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Title */}
          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="font-semibold text-foreground">
                  Job Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Software Engineer, Product Manager"
                    required
                    disabled={isLoading}
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job URL */}
          <FormField
            control={form.control}
            name="job_url"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="font-semibold text-foreground">Job URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://example.com/job-posting"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground">Location</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Remote, San Francisco, CA"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Salary Range */}
          <FormField
            control={form.control}
            name="salary_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground">Salary Range</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., $100k-$150k"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground">
                  Status <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger aria-label="Status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Applied */}
          <FormField
            control={form.control}
            name="date_applied"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground">
                  Date Applied <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="font-semibold text-foreground">Notes</FormLabel>
                <p className="text-xs text-muted-foreground mb-2">
                  Additional notes, interview details, etc.
                </p>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add any additional notes or interview details here..."
                    className="min-h-[120px] p-3"
                    disabled={isLoading}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 z-10 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-4 sm:px-0 sm:py-4 -mx-4 sm:mx-0 sm:static bg-[var(--modal-shell)] sm:bg-transparent border-t border-[var(--modal-divider)] sm:border-border mt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto min-w-[100px] min-h-[44px] sm:min-h-[38px] rounded-xl font-medium"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="copper"
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[160px] min-h-[44px] sm:min-h-[38px] rounded-xl font-semibold shadow-xs"
          >
            {isLoading
              ? submitButtonText === 'Save Changes'
                ? 'Saving...'
                : 'Creating...'
              : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  )
}
