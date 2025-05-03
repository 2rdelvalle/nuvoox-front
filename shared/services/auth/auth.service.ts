import { auth } from "@/shared/models"
import axios from "axios"

const userEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/auth`
const userService = {
  login: (auth: auth) => axios.post(`${userEndpoint}/login`, auth),
  recover: (email: string) => axios.get(`${userEndpoint}/recover/${email}`)
  // logout: (user: UserCreation) => axios.post<UserCreation>(userEndpoint, user)
}
export default userService
