import { useAuthStore } from '@/store/authStore'

/**
 * Destination for "Start free / Get started" CTAs on the marketing site:
 * the dashboard when signed in, otherwise the login page (which links to
 * register). Avoids dropping logged-out visitors straight into the wizard.
 */
export function appStartHref(): string {
  return useAuthStore.getState().isAuthenticated ? '/dashboard' : '/login'
}
