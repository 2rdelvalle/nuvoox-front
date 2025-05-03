import { Role, RoleCaratule } from "@/shared/models/role"
import axios from "axios"

const roleEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/role`
const userService = {
  caratule: () => axios.get<RoleCaratule[]>(`${roleEndpoint}/caratule`),
  caratuleForCompanies: () => axios.get<RoleCaratule[]>(`${roleEndpoint}/caratuleCompanies`),
  create: (user: Role) => axios.post<Role>(roleEndpoint, user)
}
export default userService
