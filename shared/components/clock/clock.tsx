import { useEffect, useState } from "react"
import { DateTime } from "luxon"

const Clock = () => {
  const [time, setTime] = useState(DateTime.now().setZone(Intl.DateTimeFormat().resolvedOptions().timeZone))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(DateTime.now().setZone(Intl.DateTimeFormat().resolvedOptions().timeZone))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setVisible(true)
    }, 300000) // 5 minutos
    return () => clearInterval(intervalId)
  }, [])

  if (!visible) return null

  return (
    <div onClick={() => setVisible(false)} className="flex flex-row align-items-center cursor-pointer gap-2">
      <p className="text-xl font-mono m-0 p-0">{time.toFormat("hh:mm:ss a")}</p>
      <p className="text-xs text-gray-400 m-0 p--">{time.zoneName}</p>
    </div>
  )
}

export default Clock
