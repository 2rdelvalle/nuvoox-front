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

function getMenuWithRoleType (role : RoleCaratule): MenuModel[] {
  switch (role.name) {
    case "SUPERADMIN":
      return MENU_ADMIN
    case "EMPRESA":
      return MENU_COMPANY
    case "AGENTE":
      return MENU_USER_COMPANY
    default:
      return [] as MenuModel[]
  }
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
      setModel(getMenuWithRoleType(dataToken.user.role));
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
