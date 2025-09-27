import { MenuModel } from "@/types"

export const MENU_USER_COMPANY: MenuModel[] = [
  {
    label: "Panel Inicial",
    icon: "pi pi-home",
    items: [
      {
        label: "Inicio",
        icon: "pi pi-fw pi-home",
        to: "/"
      },
      {
        label: "Chat",
        icon: "pi pi-comments", // modificado
        items: [
          {
            label: "WhatsApp",
            icon: "pi pi-whatsapp",
            to: "/chat/whatsapp"
          }
        ]
      },
      {
        label: "Envio Masivo",
        icon: "pi pi-send", // modificado
        to: "/masive-chat"
      },
      {
        label: "Campañas",
        icon: "pi pi-megaphone",
        requiresPermission: "can_send_campaigns", // Campo condicional para validación
        items: [
          {
            label: "Nueva Campaña",
            icon: "pi pi-plus-circle",
            to: "/campaigns/create"
          },
          {
            label: "Gestionar campañas",
            icon: "pi pi-list",
            to: "/campaigns/list"
          }
        ]
      }
    ]
  }
]
