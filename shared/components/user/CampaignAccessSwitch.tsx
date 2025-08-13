"use client";
import React, { useState } from 'react';
import { InputSwitch } from 'primereact/inputswitch';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { UserCaratule } from '@/shared/models/user/user.model';
import { usersCampaignsAccessService } from '@/shared/services/user/users-campaigns-access.service';
import { getCookieToken } from '@/shared/utilities/functions/sessionUtils';

interface CampaignAccessSwitchProps {
  user: UserCaratule;
  onUpdate?: (updatedUser: UserCaratule) => void;
}

/**
 * Componente Switch para controlar el acceso a campañas de un agente
 * Solo visible para usuarios con rol AGENTE
 */
export const CampaignAccessSwitch: React.FC<CampaignAccessSwitchProps> = ({ 
  user, 
  onUpdate 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAccess, setCurrentAccess] = useState(user.can_send_campaigns || false);

  // Solo mostrar para agentes
  if (user.role?.name !== 'AGENTE') {
    return <span className="text-muted">N/A</span>;
  }

  const handleToggle = async (newValue: boolean) => {
    if (isLoading) return;

    const originalValue = currentAccess;
    
    try {
      setIsLoading(true);
      // Actualización optimista en UI
      setCurrentAccess(newValue);
      
      const token = getCookieToken();
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      // Llamada al servicio backend
      const updatedUser = await usersCampaignsAccessService.updateCampaignAccess(
        user.userId,
        newValue,
        token
      );

      console.log(`[CAMPAIGN-ACCESS-SWITCH] Acceso actualizado para ${user.name}: ${newValue}`);
      
      // Notificar al componente padre si se proporciona callback
      if (onUpdate) {
        onUpdate(updatedUser);
      }
      
    } catch (error) {
      console.error('[CAMPAIGN-ACCESS-SWITCH] Error al actualizar acceso:', error);
      
      // Revertir cambio optimista en caso de error
      setCurrentAccess(originalValue);
      
      // Mostrar error al usuario (puedes usar toast si está disponible)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al actualizar acceso a campañas: ${errorMessage}`);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex align-items-center gap-2">
      {isLoading && (
        <ProgressSpinner 
          style={{ width: '16px', height: '16px' }} 
          strokeWidth="4" 
        />
      )}
      
      <InputSwitch
        checked={currentAccess}
        onChange={(e) => handleToggle(e.value)}
        disabled={isLoading}
        className={`
          ${currentAccess ? 'p-inputswitch-checked' : ''} 
          ${isLoading ? 'opacity-50' : ''}
        `}
        pt={{
          slider: {
            className: currentAccess 
              ? 'bg-green-500 border-green-500' 
              : 'bg-gray-300 border-gray-300'
          }
        }}
      />
      
      <span className={`text-sm font-medium ${
        currentAccess 
          ? 'text-green-600' 
          : 'text-gray-500'
      }`}>
        {currentAccess ? 'Habilitado' : 'Deshabilitado'}
      </span>
    </div>
  );
};

export default CampaignAccessSwitch;