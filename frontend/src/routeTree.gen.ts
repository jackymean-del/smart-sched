import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { Route as rootRoute } from "./routes/__root"
import { Route as IndexRoute } from "./routes/index"
import { Route as WizardRoute } from "./routes/wizard/index"
import { Route as TimetableRoute } from "./routes/timetable"
import { Route as DemoRoute } from "./routes/demo"

const routeTree = rootRoute.addChildren([
  IndexRoute,
  WizardRoute,
  TimetableRoute,
  DemoRoute,
])

export { routeTree }
export type AppRouter = typeof router
const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
