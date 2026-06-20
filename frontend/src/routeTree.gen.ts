import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { RootLayout }    from "./pages/root"
import { HomePage }      from "./pages/home"
import { LoginPage }     from "./pages/login"
import { RegisterPage }  from "./pages/register"
import { DashboardPage }  from "./pages/dashboard"
import { WizardPage }     from "./pages/wizard"
import { TimetablePage }  from "./pages/timetable"
import { DemoPage }       from "./pages/demo"
import { MasterDataPage } from "./pages/master-data"
import { FeaturesPage }  from "./pages/features"
import { PricingPage }   from "./pages/pricing"
import { DocsPage }      from "./pages/docs"
import { DocArticlePage } from "./pages/doc-article"
import { ContactPage }   from "./pages/contact"

const rootRoute      = createRootRoute({ component: RootLayout })
const indexRoute     = createRoute({ getParentRoute: () => rootRoute, path: "/",           component: HomePage })
const loginRoute     = createRoute({ getParentRoute: () => rootRoute, path: "/login",      component: LoginPage })
const registerRoute  = createRoute({ getParentRoute: () => rootRoute, path: "/register",   component: RegisterPage })
const dashboardRoute  = createRoute({ getParentRoute: () => rootRoute, path: "/dashboard",   component: DashboardPage })
const wizardRoute     = createRoute({ getParentRoute: () => rootRoute, path: "/wizard",      component: WizardPage })
const timetableRoute  = createRoute({ getParentRoute: () => rootRoute, path: "/timetable",   component: TimetablePage })
const demoRoute       = createRoute({ getParentRoute: () => rootRoute, path: "/demo",        component: DemoPage })
const masterDataRoute = createRoute({ getParentRoute: () => rootRoute, path: "/master-data", component: MasterDataPage })
const featuresRoute   = createRoute({ getParentRoute: () => rootRoute, path: "/features",    component: FeaturesPage })
const pricingRoute    = createRoute({ getParentRoute: () => rootRoute, path: "/pricing",     component: PricingPage })
const docsRoute       = createRoute({ getParentRoute: () => rootRoute, path: "/docs",        component: DocsPage })
const docArticleRoute = createRoute({ getParentRoute: () => rootRoute, path: "/docs/$slug",  component: DocArticlePage })
const contactRoute    = createRoute({ getParentRoute: () => rootRoute, path: "/contact",     component: ContactPage })

export const routeTree = rootRoute.addChildren([
  indexRoute, loginRoute, registerRoute, dashboardRoute,
  wizardRoute, timetableRoute, demoRoute, masterDataRoute,
  featuresRoute, pricingRoute, docsRoute, docArticleRoute, contactRoute,
])
export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
