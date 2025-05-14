'use client';

import React from 'react';
import { WhatsappMessageNotification } from './WhatsappMessageNotification';

/**
 * NotificationListener - Componente que inicializa las notificaciones de chat
 * 
 * Este componente se monta globalmente en el layout de la aplicación para
 * mostrar notificaciones de WhatsApp en tiempo real cuando llegan mensajes de clientes.
 */
export function NotificationListener() {
  return <WhatsappMessageNotification />;
}

export default NotificationListener;