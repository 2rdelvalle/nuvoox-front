"use client"
import { useRouter } from "next/navigation"

export const usePush = (route: string) => {
  const router = useRouter()

  const onClickAction: () => void = () => router.push(route)

  return { onClickAction }
}
