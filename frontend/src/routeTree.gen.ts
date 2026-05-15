import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { RootLayout }    from "./pages/root"
import { HomePage }      from "./pages/home"
import { LoginPage }     from "./pages/login"
import { RegisterPage }  from "./pages/register"
import { DashboardPage } from "./pages/dashboard"
import { WizardPage }    from "./pages/wizard"
import { TimetablePage } from "./pages/timetable"
import { DemoPage }      from "./pages/demo"

const rootRoute      = createRootRoute({ component: RootLayout })
const indexRoute     = createRoute({ getParentRoute: () => rootRoute, path: "/",           component: HomePage })
const loginRoute     = createRoute({ getParentRoute: () => rootRoute, path: "/login",      component: LoginPage })
const registerRoute  = createRoute({ getParentRoute: () => rootRoute, path: "/register",   component: RegisterPage })
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: "/dashboard",  component: DashboardPage })
const wizardRoute    = createRoute({ getParentRoute: () => rootRoute, path: "/wizard",     component: WizardPage })
const timetableRoute = createRoute({ getParentRoute: () => rootRoute, path: "/timetable",  component: TimetablePage })
const demoRoute      = createRoute({ getParentRoute: () => rootRoute, path: "/demo",       component: DemoPage })

export const routeTree = rootRoute.addChildren([
  indexRoute, loginRoute, registerRoute, dashboardRoute,
  wizardRoute, timetableRoute, demoRoute,
])
export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
