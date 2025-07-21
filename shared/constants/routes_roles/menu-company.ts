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
        icon: "pi pi-send", // modificado
        items: [
          {
            label: "Envio Masivos",
            icon: "pi pi-send", // modificado
            to: "/masive-chat"
          }
        ]
      }
    ]
  }
]
