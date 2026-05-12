import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router"
import { HomePage }      from "./pages/home"
import { WizardPage }    from "./pages/wizard"
import { TimetablePage } from "./pages/timetable"
import { DemoPage }      from "./pages/demo"
import { Topbar }        from "./components/layout/Topbar"
import { useTimetableStore } from "./store/timetableStore"

const STEP_LABELS = [
  'Organization type','Country & standards','Schedule settings',
  'How many of each?','Review & edit data','Assign subjects & staff','Generate timetable'
]

function RootLayout() {
  const step = useTimetableStore(s => s.step)
  const path = window.location.pathname
  const isWizard = path.startsWith('/wizard')
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar
        step={isWizard ? step : undefined}
        totalSteps={isWizard ? 7 : undefined}
        stepLabel={isWizard ? STEP_LABELS[step-1] : undefined}
      />
      <Outlet />
    </div>
  )
}

const rootRoute      = createRootRoute({ component: RootLayout })
const indexRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/',          component: HomePage })
const wizardRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/wizard',    component: WizardPage })
const timetableRoute = createRoute({ getParentRoute: () => rootRoute, path: '/timetable', component: TimetablePage })
const demoRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/demo',      component: DemoPage })

export const routeTree = rootRoute.addChildren([indexRoute, wizardRoute, timetableRoute, demoRoute])
export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
