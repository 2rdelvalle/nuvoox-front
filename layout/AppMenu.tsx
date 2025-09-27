"use client";
import { useState, useEffect } from 'react';
import { MENU_ADMIN, MENU_COMPANY, MENU_USER_COMPANY } from "@/shared/constants/routes_roles"
import { JWTAuth } from "@/shared/models"
import { RoleCaratule } from "@/shared/models/role"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import type { MenuModel } from "@/types"
import AppSubMenu from "./AppSubMenu"
import dynamic from "next/dynamic";

// Versión del componente que solo se renderiza en el cliente
const AppSubMenuClientOnly = dynamic(() => Promise.resolve(AppSubMenu), { ssr: false });

function getMenuWithRoleType (role : RoleCaratule, userPermissions?: any): MenuModel[] {
  const filterMenuByPermissions = (menuItems: MenuModel[]): MenuModel[] => {
    return menuItems.map(item => {
      const filteredItems = item.items ? item.items.filter(subItem => {
        // Si el item requiere un permiso específico, validarlo
        if (subItem.requiresPermission) {
          const hasPermission = userPermissions && !!userPermissions[subItem.requiresPermission];
          console.log(`[MENU-FILTER] Validando ${subItem.label}: requiresPermission=${subItem.requiresPermission}, value=${userPermissions[subItem.requiresPermission]}, hasPermission=${hasPermission}`);
          return hasPermission;
        }
        return true; // Si no requiere permiso, incluir el item
      }).map(subItem => ({
        ...subItem,
        items: subItem.items ? filterMenuByPermissions(subItem.items) : undefined
      })) : undefined;

      return {
        ...item,
        items: filteredItems
      };
    }).filter(item => {
      // Remover secciones vacías (sin items válidos)
      return !item.items || item.items.length > 0;
    });
  };

  let baseMenu: MenuModel[] = [];
  
  switch (role.name) {
    case "SUPERADMIN":
      baseMenu = MENU_ADMIN;
      break;
    case "EMPRESA":
      baseMenu = MENU_COMPANY;
      break;
    case "AGENTE":
      baseMenu = MENU_USER_COMPANY;
      break;
    default:
      return [] as MenuModel[];
  }

  // Para agentes, aplicar filtrado condicional
  if (role.name === "AGENTE" && userPermissions) {
    return filterMenuByPermissions(baseMenu);
  }

  return baseMenu;
}

const AppMenu = () => {
  // Estado para controlar si estamos en el cliente
  const [mounted, setMounted] = useState(false);
  // Estado para almacenar el modelo de menú
  const [model, setModel] = useState<MenuModel[]>([]);
  
  // Efecto que se ejecuta solo en el cliente
  useEffect(() => {
    setMounted(true);
    
    // Obtener el token y validar que sea válido
    const dataToken = getDataFromToken(getCookieToken() || "");
    
    // Determinar el modelo de menú basado en el rol del usuario
    if (dataToken && dataToken.user) {
      // Extraer permisos del usuario para filtrado condicional
      const userPermissions = {
        can_send_campaigns: dataToken.user.can_send_campaigns || false
      };
      
      console.log(`[APPMENU] Usuario: ${dataToken.user.name}, Rol: ${dataToken.user.role?.name}, can_send_campaigns: ${userPermissions.can_send_campaigns}`);
      
      setModel(getMenuWithRoleType(dataToken.user.role, userPermissions));
    } else {
      setModel([]);
    }
  }, []);
  
  // Durante el renderizado del servidor, devolver un div vacío
  // para evitar discrepancias de hidratación
  if (!mounted) {
    return <div className="layout-menu-container"></div>;
  }
  
  return <AppSubMenuClientOnly model={model} />;
}

export default AppMenu
