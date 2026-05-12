import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string, format: '12h' | '24h'): string {
  const [h, m] = time.split(':').map(Number)
  if (format === '24h') return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}
