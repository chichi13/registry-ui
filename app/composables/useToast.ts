export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])
const toastCounter = ref(0)

export function useToast() {
  const show = (type: ToastType, message: string, duration = 5000): string => {
    const id = `toast-${toastCounter.value++}`

    toasts.value.push({
      id,
      type,
      message,
      duration,
    })

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const remove = (id: string): void => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number): string => {
    return show('success', message, duration)
  }

  const error = (message: string, duration?: number): string => {
    return show('error', message, duration)
  }

  const warning = (message: string, duration?: number): string => {
    return show('warning', message, duration)
  }

  const info = (message: string, duration?: number): string => {
    return show('info', message, duration)
  }

  const clear = (): void => {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    warning,
    info,
    clear,
  }
}
