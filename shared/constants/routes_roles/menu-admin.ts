import { MenuModel } from "@/types"

export const MENU_ADMIN: MenuModel[] = [
  {
    label: "Panel Inicial",
    icon: "pi pi-home",
    items: [
      {
        label: "Inicio",
        icon: "pi pi-fw pi-home",
        to: "/"
      }
    ]
  },
  {
    label: "Panel de Administración",
    icon: "pi pi-th-large",
    items: [
      {
        label: "Usuarios",
        icon: "pi pi-users",
        to: "/admin/user/list"
      },
      {
        label: "Roles",
        icon: "pi pi-user-edit",
        to: "/admin/role/list"
      },
      {
        label: "Panel de Empresas",
        icon: "pi pi-fw pi-folder",
        items: [
          {
            label: "Administración de Empresas",
            icon: "pi pi-briefcase",
            to: "/admin/company/list"
          },
          {
            label: "Aprobaciones de Números",
            icon: "pi pi-check-circle",
            items: [
              {
                label: "Gestión de Aprobaciones",
                icon: "pi pi-cog",
                to: "/admin/aprobations/aprobations-company"
              },
              {
                label: "Listado de Aprobaciones",
                icon: "pi pi-list",
                to: "/admin/aprobations/list-aprobations-company"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    label: "Panel de Control",
    icon: "pi pi-fw pi-star-fill",
    items: [
      {
        label: "Configuraciones",
        icon: "pi pi-cog",
        items: [
          {
            label: "Tipos de Documento",
            icon: "pi pi-file",
            to: "/admin/typeDocument/list"
          },
          {
            label: "WebChat",
            icon: "pi pi-comments",
            to: "/admin/webchat"
          }
        ]
      }
    ]
  }
]
