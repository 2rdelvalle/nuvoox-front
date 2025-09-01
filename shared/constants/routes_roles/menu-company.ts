import { MenuModel } from "@/types"

export const MENU_COMPANY: MenuModel[] = [
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
    label: "Panel Administracion",
    icon: "pi pi-th-large",
    items: [
      {
        label: "Agentes",
        icon: "pi pi-users", // modificado
        to: "/admin/user/list"
      },
      {
        label: "Grupos De Agentes",
        icon: "pi pi-users", // modificado
        to: "/admin/group-agent/list"
      }
    ]
  },
  {
    label: "Panel de Control",
    icon: "pi pi-fw pi-star-fill",
    items: [
      {
        label: "Configuraciones",
        icon: "pi pi-cog", // modificado
        items: [
          {
            label: "Tipos De Documento",
            icon: "pi pi-file", // modificado
            to: "/admin/typeDocument/list"
          },
          {
            label: "Plantillas",
            icon: "pi pi-send", // modificado
            to: "/template/list"
          }
        ]
      },
      {
        label: "Campañas",
        icon: "pi pi-megaphone", // modificado
        items: [
          {
            label: "Nuevas campañas",
            icon: "pi pi-plus-circle",
            to: "/campaigns/create"
          },
          {
            label: "Gestionar campañas",
            icon: "pi pi-list",
            to: "/campaigns/list"
          },
          {
            label: "Envio Masivos",
            icon: "pi pi-send", // modificado
            to: "/masive-chat"
          }
        ]
      },
      {
        label: "Automatización",
        icon: "pi pi-sitemap",
        items: [
          {
            label: "Gestión de Flujos",
            icon: "pi pi-list",
            to: "/flows/list"
          },
          {
            label: "Crear Flujo",
            icon: "pi pi-plus",
            to: "/flows/create"
          }
        ]
      }
    ]
  }
]
