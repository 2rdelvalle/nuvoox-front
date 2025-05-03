import { JWTAuth } from "@/shared/models"

// set token to session Storage
export const setToken = (token: string) => {
  sessionStorage.setItem("token", token)
}

export const clearToken = () => {
  sessionStorage.removeItem("token")
}

// get token from session Storage
export const getToken = () => {
  return sessionStorage.getItem("token")
}

export const createCookieToken = (token: string) => {
  document.cookie = `token=${token}; path=/`
}

// get data from token
export const getDataFromToken = (token: string) : JWTAuth => {
  const base64Url = token.split(".")[1]
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join("")
  )
  return JSON.parse(jsonPayload)
}

// get token from cookie
export const getCookieToken = () => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token"))
    ?.split("=")[1]
  return token
}

// delete cookie token
export const deleteCookieToken = () => {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
}
