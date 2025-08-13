"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCookieToken, getDataFromToken } from '@/shared/utilities/functions/sessionUtils';

interface CampaignAccessGuardProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

/**
 * Guard que protege rutas de campañas verificando que el usuario tenga permisos
 * Solo permite acceso a usuarios AGENTE con can_send_campaigns = true
 */
export const CampaignAccessGuard: React.FC<CampaignAccessGuardProps> = ({ 
  children, 
  fallbackRoute = '/' 
}) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = () => {
      // Obtener datos del token
      const dataToken = getDataFromToken(getCookieToken() || "");
      
      if (!dataToken || !dataToken.user) {
        console.warn('[CAMPAIGN-ACCESS-GUARD] No hay usuario autenticado, redirigiendo...');
        setIsAuthorized(false);
        router.push(fallbackRoute);
        return;
      }

      const user = dataToken.user;
      const userRole = user.role?.name;
      const canSendCampaigns = user.can_send_campaigns || false;

      console.log(`[CAMPAIGN-ACCESS-GUARD] Verificando acceso - Usuario: ${user.name}, Rol: ${userRole}, Can Send Campaigns: ${canSendCampaigns}`);

      // Verificar que sea agente y tenga permisos de campañas
      if (userRole === 'AGENTE' && canSendCampaigns) {
        console.log(`[CAMPAIGN-ACCESS-GUARD] Acceso autorizado para ${user.name}`);
        setIsAuthorized(true);
      } else {
        console.warn(`[CAMPAIGN-ACCESS-GUARD] Acceso denegado - Usuario: ${user.name}, Rol: ${userRole}, Permisos: ${canSendCampaigns}`);
        setIsAuthorized(false);
        router.push(fallbackRoute);
      }
    };

    checkAccess();
  }, [router, fallbackRoute]);

  // Mostrar loading mientras se verifica el acceso
  if (isAuthorized === null) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#6366f1' }}></i>
          <p className="mt-3 text-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Solo renderizar children si está autorizado
  return isAuthorized ? <>{children}</> : null;
};

export default CampaignAccessGuard;
