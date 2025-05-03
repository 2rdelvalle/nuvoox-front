import { MENU_ADMIN, MENU_COMPANY, MENU_USER_COMPANY } from "@/shared/constants/routes_roles"
import { JWTAuth } from "@/shared/models"
import { RoleCaratule } from "@/shared/models/role"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import type { MenuModel } from "@/types"
import AppSubMenu from "./AppSubMenu"

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
  const dataToken : JWTAuth = getDataFromToken(getCookieToken() || "")
  const model: MenuModel[] = getMenuWithRoleType(dataToken.user.role)

  return <AppSubMenu model={model} />
}

export default AppMenu
