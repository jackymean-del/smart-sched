import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { HomePage }      from "./pages/home"
import { WizardPage }    from "./pages/wizard"
import { TimetablePage } from "./pages/timetable"
import { DemoPage }      from "./pages/demo"
import { RootLayout }    from "./pages/root"

const rootRoute      = createRootRoute({ component: RootLayout })
const indexRoute     = createRoute({ getParentRoute: () => rootRoute, path: "/",          component: HomePage })
const wizardRoute    = createRoute({ getParentRoute: () => rootRoute, path: "/wizard",    component: WizardPage })
const timetableRoute = createRoute({ getParentRoute: () => rootRoute, path: "/timetable", component: TimetablePage })
const demoRoute      = createRoute({ getParentRoute: () => rootRoute, path: "/demo",      component: DemoPage })

export const routeTree = rootRoute.addChildren([indexRoute, wizardRoute, timetableRoute, demoRoute])
export const router    = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
