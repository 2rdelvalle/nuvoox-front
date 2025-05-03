import { useMemo } from "react"
import { DateTime } from "luxon"

const useTimeFromMillis = (ms: number) => {
  const formattedTime = useMemo(() => {
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return DateTime.fromMillis(ms).setZone(browserZone).toFormat("HH:mm")
  }, [ms])

  return formattedTime
}

export default useTimeFromMillis
