/**
 * User preference for inline step guides. A single global toggle the user
 * controls; persisted so their choice sticks across sessions. Defaults on so
 * new users get guidance, then can switch it off everywhere.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GuidePrefsState {
  enabled: boolean
  setEnabled: (v: boolean) => void
  toggle: () => void
}

export const useGuidePrefs = create<GuidePrefsState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    { name: 'schedu-guide-prefs' }
  )
)
