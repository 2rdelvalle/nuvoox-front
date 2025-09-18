"use client";

import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { 
  InteractiveMessageType, 
  QuickReplyButton, 
  ListSection, 
  InteractiveMessageBuilder,
  DEFAULT_INTERACTIVE_CONFIG
} from '@/shared/models/interactive-message.model';
import { sendQuickReply, sendList } from '../service/chatServices';
import { useToast } from '@/shared/context/toast/toastContext';

interface InteractiveMessageComposerProps {
  isVisible: boolean;
  onHide: () => void;
  recipientPhone: string;
  accessToken: string;
  phoneNumberId: string;
  onMessageSent?: (messageId: string, type: InteractiveMessageType) => void;
}

interface MessageTemplate {
  name: string;
  type: InteractiveMessageType;
  bodyText: string;
  buttonText?: string;
  buttons?: QuickReplyButton[];
  sections?: ListSection[];
}

const PREDEFINED_TEMPLATES: MessageTemplate[] = [
  {
    name: "Soporte Técnico",
    type: "quick_reply",
    bodyText: "¿En qué podemos ayudarte?",
    buttons: [
      { id: "soporte_tecnico", title: "Soporte Técnico" },
      { id: "facturacion", title: "Facturación" },
      { id: "general", title: "Consulta General" }
    ]
  },
  {
    name: "Catálogo de Productos",
    type: "list",
    bodyText: "Explora nuestro catálogo de productos:",
    buttonText: "Ver categorías",
    sections: [
      {
        title: "Tecnología",
        rows: [
          { id: "smartphones", title: "Smartphones", description: "iPhone, Samsung, Xiaomi" },
          { id: "laptops", title: "Laptops", description: "Gaming, Oficina, Ultrabooks" },
          { id: "accesorios", title: "Accesorios", description: "Auriculares, Cargadores, Cases" }
        ]
      },
      {
        title: "Hogar",
        rows: [
          { id: "electrodomesticos", title: "Electrodomésticos", description: "Neveras, Lavadoras, Hornos" },
          { id: "decoracion", title: "Decoración", description: "Muebles, Plantas, Arte" }
        ]
      }
    ]
  },
  {
    name: "Encuesta de Satisfacción",
    type: "quick_reply",
    bodyText: "¿Cómo calificarías nuestro servicio?",
    buttons: [
      { id: "excelente", title: "😍 Excelente" },
      { id: "bueno", title: "😊 Bueno" },
      { id: "regular", title: "😐 Regular" }
    ]
  }
];

export const InteractiveMessageComposer: React.FC<InteractiveMessageComposerProps> = ({
  isVisible,
  onHide,
  recipientPhone,
  accessToken,
  phoneNumberId,
  onMessageSent
}) => {
  const { showSuccess, showError } = useToast();
  const [messageType, setMessageType] = useState<InteractiveMessageType>('quick_reply');
  const [bodyText, setBodyText] = useState('');
  const [buttonText, setButtonText] = useState('Ver opciones');
  const [quickReplyButtons, setQuickReplyButtons] = useState<QuickReplyButton[]>([
    { id: '', title: '' }
  ]);
  const [listSections, setListSections] = useState<ListSection[]>([
    { title: '', rows: [{ id: '', title: '', description: '' }] }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const builder = new InteractiveMessageBuilder(DEFAULT_INTERACTIVE_CONFIG);

  // Opciones para el dropdown de tipo de mensaje
  const messageTypeOptions = [
    { label: '📱 Respuesta Rápida (Botones)', value: 'quick_reply' },
    { label: '📋 Lista Interactiva', value: 'list' }
  ];

  // Opciones para plantillas predefinidas
  const templateOptions = [
    { label: 'Mensaje personalizado', value: null },
    ...PREDEFINED_TEMPLATES.map(template => ({
      label: `📝 ${template.name}`,
      value: template
    }))
  ];

  // Aplicar plantilla seleccionada
  useEffect(() => {
    if (selectedTemplate) {
      setMessageType(selectedTemplate.type);
      setBodyText(selectedTemplate.bodyText);
      if (selectedTemplate.buttonText) {
        setButtonText(selectedTemplate.buttonText);
      }
      if (selectedTemplate.buttons) {
        setQuickReplyButtons(selectedTemplate.buttons);
      }
      if (selectedTemplate.sections) {
        setListSections(selectedTemplate.sections);
      }
    }
  }, [selectedTemplate]);

  // Validar en tiempo real
  useEffect(() => {
    validateMessage();
  }, [messageType, bodyText, buttonText, quickReplyButtons, listSections]);

  const validateMessage = () => {
    let validation;
    if (messageType === 'quick_reply') {
      validation = builder.validateQuickReply(bodyText, quickReplyButtons);
    } else {
      validation = builder.validateList(bodyText, buttonText, listSections);
    }
    setValidationErrors(validation.errors);
  };

  // Agregar/quitar botones de Quick Reply
  const addQuickReplyButton = () => {
    if (quickReplyButtons.length < DEFAULT_INTERACTIVE_CONFIG.maxButtons) {
      setQuickReplyButtons([...quickReplyButtons, { id: '', title: '' }]);
    }
  };

  const removeQuickReplyButton = (index: number) => {
    if (quickReplyButtons.length > 1) {
      setQuickReplyButtons(quickReplyButtons.filter((_, i) => i !== index));
    }
  };

  const updateQuickReplyButton = (index: number, field: keyof QuickReplyButton, value: string) => {
    const updated = [...quickReplyButtons];
    updated[index] = { ...updated[index], [field]: value };
    setQuickReplyButtons(updated);
  };

  // Gestión de secciones y filas de lista
  const addListSection = () => {
    if (listSections.length < DEFAULT_INTERACTIVE_CONFIG.maxSections) {
      setListSections([...listSections, { title: '', rows: [{ id: '', title: '', description: '' }] }]);
    }
  };

  const removeListSection = (index: number) => {
    if (listSections.length > 1) {
      setListSections(listSections.filter((_, i) => i !== index));
    }
  };

  const updateListSection = (index: number, field: keyof ListSection, value: any) => {
    const updated = [...listSections];
    updated[index] = { ...updated[index], [field]: value };
    setListSections(updated);
  };

  const addListRow = (sectionIndex: number) => {
    const totalRows = listSections.reduce((total, section) => total + section.rows.length, 0);
    if (totalRows < DEFAULT_INTERACTIVE_CONFIG.maxTotalRows) {
      const updated = [...listSections];
      updated[sectionIndex].rows.push({ id: '', title: '', description: '' });
      setListSections(updated);
    }
  };

  const removeListRow = (sectionIndex: number, rowIndex: number) => {
    const updated = [...listSections];
    if (updated[sectionIndex].rows.length > 1) {
      updated[sectionIndex].rows.splice(rowIndex, 1);
      setListSections(updated);
    }
  };

  const updateListRow = (sectionIndex: number, rowIndex: number, field: string, value: string) => {
    const updated = [...listSections];
    updated[sectionIndex].rows[rowIndex] = { 
      ...updated[sectionIndex].rows[rowIndex], 
      [field]: value 
    };
    setListSections(updated);
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if (validationErrors.length > 0) {
      showError('Por favor corrija los errores antes de enviar');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      let messageId;

      if (messageType === 'quick_reply') {
        result = await sendQuickReply(
          recipientPhone,
          bodyText,
          quickReplyButtons,
          accessToken,
          phoneNumberId
        );
        messageId = result.messages?.[0]?.id;
      } else {
        result = await sendList(
          recipientPhone,
          bodyText,
          buttonText,
          listSections,
          accessToken,
          phoneNumberId
        );
        messageId = result.messages?.[0]?.id;
      }

      showSuccess(`✅ Mensaje interactivo enviado exitosamente`);
      if (onMessageSent && messageId) {
        onMessageSent(messageId, messageType);
      }
      onHide();
      resetForm();
    } catch (error: any) {
      console.error('Error enviando mensaje interactivo:', error);
      showError(`Error al enviar mensaje: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBodyText('');
    setButtonText('Ver opciones');
    setQuickReplyButtons([{ id: '', title: '' }]);
    setListSections([{ title: '', rows: [{ id: '', title: '', description: '' }] }]);
    setSelectedTemplate(null);
    setValidationErrors([]);
  };

  const renderQuickReplyComposer = () => (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold mb-3">📱 Respuesta Rápida (Botones)</h4>
      
      {quickReplyButtons.map((button, index) => (
        <Card key={index} className="p-3">
          <div className="flex gap-3 align-items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">ID del Botón {index + 1}</label>
              <InputText
                value={button.id}
                onChange={(e) => updateQuickReplyButton(index, 'id', e.target.value)}
                placeholder="ej: opcion_1"
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Título {button.title.length}/{DEFAULT_INTERACTIVE_CONFIG.maxButtonTitleLength}
              </label>
              <InputText
                value={button.title}
                onChange={(e) => updateQuickReplyButton(index, 'title', e.target.value)}
                placeholder="ej: Sí, me interesa"
                className="w-full"
                maxLength={DEFAULT_INTERACTIVE_CONFIG.maxButtonTitleLength}
              />
            </div>
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              disabled={quickReplyButtons.length <= 1}
              onClick={() => removeQuickReplyButton(index)}
              tooltip="Eliminar botón"
            />
          </div>
        </Card>
      ))}
      
      <div className="flex justify-content-between align-items-center">
        <Button
          label="Agregar Botón"
          icon="pi pi-plus"
          text
          disabled={quickReplyButtons.length >= DEFAULT_INTERACTIVE_CONFIG.maxButtons}
          onClick={addQuickReplyButton}
        />
        <Badge 
          value={`${quickReplyButtons.length}/${DEFAULT_INTERACTIVE_CONFIG.maxButtons}`} 
          severity={quickReplyButtons.length >= DEFAULT_INTERACTIVE_CONFIG.maxButtons ? "danger" : "info"}
        />
      </div>
    </div>
  );

  const renderListComposer = () => {
    const totalRows = listSections.reduce((total, section) => total + section.rows.length, 0);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-content-between align-items-center">
          <h4 className="text-lg font-semibold mb-3">📋 Lista Interactiva</h4>
          <Badge 
            value={`${totalRows}/${DEFAULT_INTERACTIVE_CONFIG.maxTotalRows} filas`} 
            severity={totalRows >= DEFAULT_INTERACTIVE_CONFIG.maxTotalRows ? "danger" : "info"}
          />
        </div>

        <div className="field">
          <label className="block text-sm font-medium mb-1">Texto del Botón</label>
          <InputText
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="ej: Ver opciones"
            className="w-full"
          />
        </div>

        {listSections.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="p-4">
            <div className="flex justify-content-between align-items-center mb-3">
              <h5 className="font-semibold">Sección {sectionIndex + 1}</h5>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                disabled={listSections.length <= 1}
                onClick={() => removeListSection(sectionIndex)}
                tooltip="Eliminar sección"
              />
            </div>

            <div className="field mb-3">
              <label className="block text-sm font-medium mb-1">Título de la Sección</label>
              <InputText
                value={section.title}
                onChange={(e) => updateListSection(sectionIndex, 'title', e.target.value)}
                placeholder="ej: Productos disponibles"
                className="w-full"
              />
            </div>

            <Divider />

            {section.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="border-1 surface-border border-round p-3 mb-2">
                <div className="flex justify-content-between align-items-start mb-2">
                  <span className="text-sm font-medium">Fila {rowIndex + 1}</span>
                  <Button
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    text
                    disabled={section.rows.length <= 1}
                    onClick={() => removeListRow(sectionIndex, rowIndex)}
                    tooltip="Eliminar fila"
                  />
                </div>
                
                <div className="grid">
                  <div className="col-12 md:col-4">
                    <label className="block text-xs mb-1">ID</label>
                    <InputText
                      value={row.id}
                      onChange={(e) => updateListRow(sectionIndex, rowIndex, 'id', e.target.value)}
                      placeholder="ej: producto_1"
                      className="w-full"
                      size="small"
                    />
                  </div>
                  <div className="col-12 md:col-4">
                    <label className="block text-xs mb-1">
                      Título {row.title.length}/{DEFAULT_INTERACTIVE_CONFIG.maxRowTitleLength}
                    </label>
                    <InputText
                      value={row.title}
                      onChange={(e) => updateListRow(sectionIndex, rowIndex, 'title', e.target.value)}
                      placeholder="ej: iPhone 15"
                      className="w-full"
                      size="small"
                      maxLength={DEFAULT_INTERACTIVE_CONFIG.maxRowTitleLength}
                    />
                  </div>
                  <div className="col-12 md:col-4">
                    <label className="block text-xs mb-1">
                      Descripción {(row.description?.length || 0)}/{DEFAULT_INTERACTIVE_CONFIG.maxRowDescriptionLength}
                    </label>
                    <InputText
                      value={row.description || ''}
                      onChange={(e) => updateListRow(sectionIndex, rowIndex, 'description', e.target.value)}
                      placeholder="ej: Desde $999 USD"
                      className="w-full"
                      size="small"
                      maxLength={DEFAULT_INTERACTIVE_CONFIG.maxRowDescriptionLength}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              label="Agregar Fila"
              icon="pi pi-plus"
              text
              size="small"
              disabled={totalRows >= DEFAULT_INTERACTIVE_CONFIG.maxTotalRows}
              onClick={() => addListRow(sectionIndex)}
            />
          </Card>
        ))}

        <Button
          label="Agregar Sección"
          icon="pi pi-plus"
          text
          disabled={listSections.length >= DEFAULT_INTERACTIVE_CONFIG.maxSections}
          onClick={addListSection}
        />
      </div>
    );
  };

  return (
    <Dialog
      header="🎛️ Crear Mensaje Interactivo"
      visible={isVisible}
      onHide={onHide}
      style={{ width: '90vw', maxWidth: '900px' }}
      maximizable
      modal
    >
      <div className="space-y-4">
        {/* Plantillas Predefinidas */}
        <Card className="p-3">
          <div className="field">
            <label className="block text-sm font-medium mb-2">📝 Plantilla</label>
            <Dropdown
              value={selectedTemplate}
              options={templateOptions}
              onChange={(e) => setSelectedTemplate(e.value)}
              placeholder="Selecciona una plantilla o crea un mensaje personalizado"
              className="w-full"
            />
          </div>
        </Card>

        {/* Tipo de Mensaje */}
        <Card className="p-3">
          <div className="field">
            <label className="block text-sm font-medium mb-2">Tipo de Mensaje</label>
            <Dropdown
              value={messageType}
              options={messageTypeOptions}
              onChange={(e) => setMessageType(e.value)}
              className="w-full"
            />
          </div>
        </Card>

        {/* Texto Principal */}
        <Card className="p-3">
          <div className="field">
            <label className="block text-sm font-medium mb-2">
              📝 Texto Principal {bodyText.length}/1024
            </label>
            <InputTextarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Escribe el mensaje principal aquí..."
              rows={3}
              className="w-full"
              maxLength={1024}
            />
          </div>
        </Card>

        {/* Composer específico según tipo */}
        <Card className="p-4">
          {messageType === 'quick_reply' ? renderQuickReplyComposer() : renderListComposer()}
        </Card>

        {/* Errores de validación */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <Message key={index} severity="error" text={error} />
            ))}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-content-end gap-2 pt-3">
          <Button
            label="Cancelar"
            severity="secondary"
            text
            onClick={onHide}
            disabled={isLoading}
          />
          <Button
            label={isLoading ? "Enviando..." : "Enviar Mensaje"}
            icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-send"}
            disabled={isLoading || validationErrors.length > 0}
            onClick={sendMessage}
          />
        </div>
      </div>
    </Dialog>
  );
};
