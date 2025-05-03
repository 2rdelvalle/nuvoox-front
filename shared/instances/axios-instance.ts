import axios from "axios"

const axiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_URL_SIRA_BACK,
  headers: {
    "Content-type": "application/json"
  }
})

export { axiosInstance }
