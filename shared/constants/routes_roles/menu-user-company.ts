import { MenuModel } from "@/types"
import { UserCaratule } from "@/shared/models"

export const getMenuUserCompany = (user?: UserCaratule): MenuModel[] => {
  const baseItems = [
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
    }
  ];

  // Solo agregar "Envío Masivo" si el usuario tiene el privilegio
  if (user?.can_send_campaigns) {
    baseItems.push({
      label: "Envio Masivo",
      icon: "pi pi-send", // modificado
      to: "/masive-chat"
    });
  }

  return [
    {
      label: "Panel Inicial",
      icon: "pi pi-home",
      items: baseItems
    }
  ];
};

// Mantener compatibilidad con el menú estático para casos donde no se tenga el usuario
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
      }
    ]
  }
]
