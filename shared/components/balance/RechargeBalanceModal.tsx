'use client';
import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { useToast } from '@/shared/context/toast/toastContext';
import { BalanceService } from '@/shared/services';
import { CompanyBalanceDto } from '@/shared/services/balance/dtos/company-balance.dto';

// Interfaz para manejar diferentes formatos de respuesta del backend
interface BalanceResponseVariant extends Partial<CompanyBalanceDto> {
  // Definimos un índice de firma para permitir acceso a propiedades adicionales
  // sin generar errores de TypeScript
  [key: string]: any; // Para cualquier otra propiedad que pueda existir
}

interface RechargeBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  onSuccess?: (balance: CompanyBalanceDto) => void;
}

/**
 * Modal para que el superadministrador recargue saldo a una empresa
 */
const RechargeBalanceModal = ({ isOpen, onClose, companyId, companyName, onSuccess }: RechargeBalanceModalProps) => {
  const [amount, setAmount] = useState<string>('0.00');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<CompanyBalanceDto | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  const { showSuccess, showError } = useToast();

  // Cargar el saldo actual y la tasa de cambio al abrir el modal
  useEffect(() => {
    if (isOpen && companyId) {
      // Restablecer el estado del currentBalance para evitar mostrar datos antiguos
      setCurrentBalance(null);
      
      // Pequeño retraso para asegurar que el estado se haya limpiado
      setTimeout(() => {
        // Forzar la obtención de datos frescos
        fetchCurrentBalance();
        fetchExchangeRate();
      }, 50);
    } else {
      // Limpiar el estado cuando se cierra el modal
      setCurrentBalance(null);
    }
  }, [isOpen, companyId]);
  
  // Actualizar el saldo cuando el modal está abierto
  // Este efecto se ejecutará cada vez que el modal esté abierto (cada 3 segundos)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isOpen && companyId) {
      // Actualizamos inmediatamente para tener el saldo más reciente
      fetchCurrentBalance();
      
      // Configuramos una actualización periódica mientras el modal esté abierto
      intervalId = setInterval(() => {
        fetchCurrentBalance();
      }, 3000); // Actualizar cada 3 segundos
    }
    
    // Limpieza del intervalo cuando el componente se desmonta o el modal se cierra
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOpen, companyId]);

  // Obtener el saldo actual de la empresa
  const fetchCurrentBalance = async () => {
    try {
      console.log(`[${new Date().toISOString()}] Solicitando saldo fresco para companyId:`, companyId);
      const response = await BalanceService.getBalance(companyId);
      console.log(`[${new Date().toISOString()}] Respuesta del servicio de balance:`, response);
      
      // Si no hay respuesta válida, mostramos error y salimos
      if (!response) {
        console.error('Error: Respuesta vacía del servicio de balance');
        return;
      }
      
      // Tratamos la respuesta como nuestra interfaz flexible
      const balanceData = response as BalanceResponseVariant;
      
      // Normalizar el balance en caso de recibir formatos diferentes
      let balanceValue: number = 0;
      
      // Intentamos extraer el valor del balance en diferentes formatos posibles
      if (typeof balanceData.balanceUSD === 'number') {
        balanceValue = balanceData.balanceUSD;
      } else if (typeof balanceData.balanceUSD === 'string') {
        balanceValue = parseFloat(balanceData.balanceUSD);
      } else if (balanceData.balance) {
        balanceValue = typeof balanceData.balance === 'number' ? 
                      balanceData.balance : 
                      parseFloat(balanceData.balance as string);
      } else if ((balanceData as any).balance_usd) {
        balanceValue = typeof (balanceData as any).balance_usd === 'number' ? 
                      (balanceData as any).balance_usd : 
                      parseFloat((balanceData as any).balance_usd as string);
      }
      
      const normalizedBalance: CompanyBalanceDto = {
        companyId,
        balanceUSD: balanceValue,
        exchangeRate: balanceData.exchangeRate || exchangeRate || 0,
        lastUpdated: balanceData.lastUpdated || new Date()
      };
      
      console.log(`[${new Date().toISOString()}] Saldo normalizado:`, normalizedBalance);
      setCurrentBalance(normalizedBalance);
    } catch (error) {
      console.error('Error al obtener saldo actual:', error);
    }
  };

  // Obtener la tasa de cambio actual
  const fetchExchangeRate = async () => {
    try {
      const rate = await BalanceService.getExchangeRate();
      setExchangeRate(rate);
    } catch (error) {
      console.error('Error al obtener tasa de cambio:', error);
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    // Validar el monto
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showError('Por favor, ingrese un monto válido mayor a 0');
      return;
    }

    try {
      setLoading(true);
      
      // Convertir el monto a un entero preciso sin redondeos
      // Multiplicamos por 100 y truncamos para tener un valor exacto en céntimos
      const amountNum = parseFloat(amount);
      const rechargeAmountInt = Math.trunc(amountNum * 100);
      // El valor para mostrar en logs y operaciones de negocio
      const rechargeAmount = rechargeAmountInt / 100;
      console.log('Monto a recargar exacto (céntimos):', rechargeAmountInt, 'que representa:', rechargeAmount);
      
      // Obtener el saldo actual de forma explícita antes de la recarga
      let currentUsdBalance = 0;
      try {
        // Forzamos una llamada directa al servidor para obtener el saldo más actualizado
        const currentBalanceData = await BalanceService.getBalance(companyId);
        console.log('Saldo actual antes de recarga:', currentBalanceData);
        
        // Extraemos el valor numérico del saldo actual y lo convertimos a un entero (céntimos)
        let currentUsdBalanceInt = 0;
        
        if (typeof currentBalanceData.balanceUSD === 'number') {
          // Convertimos a entero multiplicando por 100 y truncando (sin redondear)
          currentUsdBalanceInt = Math.trunc(currentBalanceData.balanceUSD * 100);
        } else if (currentBalanceData.balanceUSD && typeof currentBalanceData.balanceUSD === 'string') {
          // Si es string, primero parseamos y luego convertimos a entero
          currentUsdBalanceInt = Math.trunc(parseFloat(currentBalanceData.balanceUSD) * 100);
        } else {
          // Si no se puede obtener el saldo en formato estándar, usamos 0
          currentUsdBalanceInt = 0;
          console.warn('No se pudo obtener el saldo en formato estándar');
        }
        
        // Convertimos de nuevo a formato decimal para mostrar/operar
        currentUsdBalance = currentUsdBalanceInt / 100;
        
        console.log('Saldo actual extraído y formateado:', currentUsdBalance);
      } catch (error) {
        console.error('Error al obtener el saldo actual:', error);
        // Si no podemos obtener el saldo actual, usamos el que ya tenemos en el componente
        if (currentBalance?.balanceUSD) {
          currentUsdBalance = parseFloat(currentBalance.balanceUSD.toFixed(2));
          console.log('Usando saldo del estado local:', currentUsdBalance);
        }
      }
      
      // Aseguramos que el saldo actual ya esté en céntimos (enteros) y sin redondeo
      const currentUsdBalanceInt = Math.trunc(currentUsdBalance * 100);
      // Operación de suma con enteros exactos
      const expectedNewBalanceInt = currentUsdBalanceInt + rechargeAmountInt;
      // Convertimos de nuevo a decimal para mostrar
      const expectedNewBalance = expectedNewBalanceInt / 100;
      
      console.log(`Operación de recarga (enteros): ${currentUsdBalanceInt} + ${rechargeAmountInt} = ${expectedNewBalanceInt}`);
      console.log('Saldo esperado después de recarga:', expectedNewBalance);
      
      // Realizamos la recarga de saldo - El servicio ya se encarga de la acumulación correcta
      const response = await BalanceService.rechargeBalance({
        companyId,
        amountUSD: rechargeAmount,
        description: description.trim() || `Recarga de saldo a ${companyName}`
      });
      
      console.log('Respuesta del servicio de recarga (con acumulación forzada):', response);
      
      // Usamos directamente el saldo acumulado que devuelve el servicio modificado
      let newBalance = 0;
      
      if (response && typeof response.balanceUSD === 'number') {
        newBalance = response.balanceUSD;
        console.log('Nuevo saldo acumulado:', newBalance);
      } else {
        // Fallback a nuestro cálculo si por alguna razón falla el servicio
        newBalance = expectedNewBalance;
        console.warn('Usando cálculo local como fallback:', newBalance);
      }
      
      console.log('Saldo final después de recarga:', newBalance);
      
      // Actualizar SIEMPRE el estado local con el nuevo saldo
      setCurrentBalance({
        companyId,
        balanceUSD: newBalance,
        exchangeRate: exchangeRate || 0,
        lastUpdated: new Date()
      });
      
      // Formatear el saldo para el mensaje de éxito
      const formattedBalance = typeof newBalance === 'number' ? 
        newBalance.toFixed(2) : 
        typeof newBalance === 'string' ? 
          parseFloat(newBalance).toFixed(2) : 
          '0.00';
          
      showSuccess(`Saldo recargado exitosamente. Nuevo saldo: $${formattedBalance} USD`);
      
      // La respuesta ya contiene el saldo actualizado gracias al sistema de reintentos
      // del servicio BalanceService.rechargeBalance
      console.log(`[${new Date().toISOString()}] Respuesta con saldo actualizado del backend:`, response);
      
      // Normalizamos el valor de balanceUSD para asegurar consistencia de tipos
      const normalizedResponse = {
        ...response,
        balanceUSD: typeof response.balanceUSD === 'string' ? 
          parseFloat(response.balanceUSD) : 
          response.balanceUSD
      };
      
      // Actualizamos el estado local del componente con el saldo normalizado
      setCurrentBalance(normalizedResponse);
      
      // Actualizar el balance en el componente padre si se proporciona el callback
      if (onSuccess) {
        onSuccess(normalizedResponse);
      }
      
      // Pequeña pausa para que el usuario pueda ver el saldo actualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Limpiar el formulario y cerrar el modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error al recargar saldo:', error);
      showError('Error al recargar saldo. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar el formulario
  const resetForm = () => {
    setAmount('0.00');
    setDescription('');
    
    // Forzamos una actualización del saldo actual
    fetchCurrentBalance();
  };

  // Calcular el valor en COP basado en el monto en USD y la tasa de cambio
  const calculateCOP = (usdAmount: string): string => {
    if (!usdAmount || isNaN(parseFloat(usdAmount)) || !exchangeRate) {
      return '0';
    }
    return (parseFloat(usdAmount) * exchangeRate).toFixed(2);
  };

  // Definición de los botones de acción para el pie del diálogo
  const footerContent = (
    <div className="flex justify-end gap-2">
      <Button 
        label="Cancelar" 
        icon="pi pi-times" 
        onClick={onClose} 
        className="p-button-text p-button-danger" 
      />
      <Button 
        label="Recargar Saldo" 
        icon="pi pi-check" 
        onClick={handleSubmit} 
        loading={loading}
        disabled={!amount || parseFloat(amount) <= 0}
        className="p-button-primary" 
      />
    </div>
  );

  return (
    <Dialog 
      header={`Recargar Saldo a ${companyName}`}
      visible={isOpen} 
      onHide={onClose}
      style={{ width: '450px' }}
      modal
      footer={footerContent}
      closeOnEscape
      className="p-fluid"
    >
      {currentBalance && (
        <div className="mb-4 p-3 bg-gray-100 rounded-md">
          <p className="text-sm font-semibold">Saldo actual:</p>
          <p className="text-lg font-bold">
            ${typeof currentBalance.balanceUSD === 'number' ? 
              currentBalance.balanceUSD.toFixed(2) : 
              '0.00'} USD
          </p>
          <p className="text-sm">
            ${typeof currentBalance.balanceUSD === 'number' && typeof exchangeRate === 'number' ? 
              (currentBalance.balanceUSD * exchangeRate).toFixed(2) : 
              '0.00'} COP
          </p>
        </div>
      )}
      
      <div className="field mb-4">
        <label htmlFor="amount" className="block text-sm font-medium mb-2">Monto en USD</label>
        <div className="flex items-center w-full relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 z-10">$</span>
          <InputNumber
            id="amount"
            value={parseFloat(amount) || null} 
            onValueChange={(e) => setAmount(e.value?.toString() || '')}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={2}
            min={0.01}
            placeholder="0.00"
            className="w-full pl-10"
            suffix=" USD"
          />
        </div>
      </div>
      
      {exchangeRate > 0 && amount && !isNaN(parseFloat(amount)) && (
        <div className="mt-2 mb-4 text-sm text-gray-600">
          Equivalente: ${calculateCOP(amount)} COP (Tasa: ${exchangeRate.toFixed(2)})
        </div>
      )}
      
      <div className="field">
        <label htmlFor="description" className="block text-sm font-medium mb-2">Descripción (opcional)</label>
        <InputTextarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Ingrese una descripción para esta recarga"
          className="w-full"
        />
      </div>
    </Dialog>
  );
};

export default RechargeBalanceModal;
