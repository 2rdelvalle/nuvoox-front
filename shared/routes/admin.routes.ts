export const ADMIN_ROUTES = {
  DASHBOARD: "/",
  USER: {
    LIST: "/admin/user/list",
    CREATE: "/admin/user/form"
  },
  ROLE: {
    LIST: "/admin/role/list",
    CREATE: "/admin/role/form"
  },
  TYPEDOCUMENT: {
    LIST: "/admin/typedocument/list",
    CREATE: "/admin/typedocument/form"
  },
  COMPANY: {
    LIST: "/admin/company/list",
    CREATE: "/admin/company/form",
    TRANSACTION_HISTORY: "/admin/company/transaction-history"
  },
  GROUP_AGENT: {
    LIST: "/admin/group-agent/list",
    CREATE: "/admin/group-agent/form"
  },
  TEMPLATE: {
    LIST: "/template/list",
    CREATE: "/template/form"
  }
}
