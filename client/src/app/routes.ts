// The app's URL paths. Kept apart from the component that renders the router
// so the many views and components that only need to link somewhere don't
// depend on the routing tree itself.

export enum AppRoute {
  ROOT = "/",
  PROGRAM = "/program",
  PROGRAM_ITEM = "/program/item",
  HELPER = "/helper",
  ADMIN = "/admin",
  ADMIN_LOGIN = "/admin/login",
  PROFILE = "/profile",
  REGISTRATION = "/registration",
  LOGIN = "/login",
  LOGOUT = "/logout",
  ABOUT = "/about",
  DASHBOARD = "/dashboard",
  NOTIFICATIONS = "/notifications",
  KOMPASSI_LOGOUT_CALLBACK = "/kompassi-logout-callback",
  ANY = "/*",
}

export enum ProgramTab {
  MY_PROGRAM = "/program/myprogram",
  PROGRAM_LIST = "/program/list",
}

export enum AboutTab {
  HELP = "/about/help",
  FAQ = "/about/faq",
  ABOUT = "/about/about",
}

export enum ProfileTab {
  PROFILE = "/profile/profile",
  GROUP = "/profile/group",
}
