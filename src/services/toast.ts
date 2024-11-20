import { toast } from 'sonner'

export const toastService = {
  success(message: string, description?: string) {
    toast.success(message, {
      description,
      duration: 5000,
      className: 'bg-success text-white',
    })
  },

  error(message: string, description?: string) {
    toast.error(message, {
      description,
      duration: 7000,
      className: 'bg-destructive text-white',
    })
  },

  warning(message: string, description?: string) {
    toast.warning(message, {
      description,
      duration: 6000,
      className: 'bg-warning text-white',
    })
  },

  info(message: string, description?: string) {
    toast.info(message, {
      description,
      duration: 5000,
      className: 'bg-primary text-white',
    })
  },

  promise<T>(
    promise: Promise<T>,
    {
      loading = 'Loading...',
      success = 'Success!',
      error = 'Something went wrong'
    }: {
      loading?: string
      success?: string | ((data: T) => string)
      error?: string | ((error: any) => string)
    } = {}
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error,
    })
  }
} 