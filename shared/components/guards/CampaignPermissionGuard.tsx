"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCookieToken, getDataFromToken } from '@/shared/utilities/functions/sessionUtils'
import { useToast } from '@/shared/context/toast/toastContext'

interface CampaignPermissionGuardProps {
  children: React.ReactNode
}

/**
 * Guard que protege rutas que requieren el privilegio de envío masivo
 * Solo permite el acceso si el usuario tiene can_send_campaigns = true
 */
export const CampaignPermissionGuard: React.FC<CampaignPermissionGuardProps> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()
  const { showError } = useToast()

  useEffect(() => {
    const checkPermission = () => {
      try {
        const token = getCookieToken()
        if (!token) {
          showError('Sesión no válida')
          router.push('/')
          return
        }

        const dataToken = getDataFromToken(token)
        if (!dataToken?.user) {
          showError('Usuario no encontrado')
          router.push('/')
          return
        }

        // Verificar si el usuario tiene el privilegio de envío masivo
        if (!dataToken.user.can_send_campaigns) {
          showError('No tienes permisos para acceder al envío masivo')
          router.push('/')
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Error verificando permisos:', error)
        showError('Error al verificar permisos')
        router.push('/')
      }
    }

    checkPermission()
  }, [router, showError])

  // Mostrar loading mientras se verifica el permiso
  if (isAuthorized === null) {
    return (
      <div className="flex align-items-center justify-content-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
          <p className="mt-3">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Si está autorizado, mostrar el contenido
  if (isAuthorized) {
    return <>{children}</>
  }

  // Si no está autorizado, no mostrar nada (ya se redirigió)
  return null
}
