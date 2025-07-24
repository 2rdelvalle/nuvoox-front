'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import CampaignForm from '@/shared/components/campaign/CampaignForm';
import { CampaignService, CampaignResponseDto } from '@/shared/services/campaign/campaign.service';
import { CampaignFormData, CampaignType } from '@/shared/models/campaign';

const EditCampaignPage = () => {
  const params = useParams();
  const campaignId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignResponseDto | null>(null);
  const [initialData, setInitialData] = useState<Partial<CampaignFormData>>({});
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await CampaignService.getById(campaignId);
      setCampaign(data);
      
      // Preparar datos iniciales para el formulario
      const formData: Partial<CampaignFormData> = {
        name: data.name,
        type: data.type as CampaignType,
        description: data.description || '',
        agentGroupTag: data.agentGroupTag || '',
        templateId: data.template.id,
        selectedAgentIds: data.selectedAgents.map(agent => agent.id),
        useAgentGroup: !!data.agentGroupTag
      };
      
      setInitialData(formData);
    } catch (error: any) {
      console.error('Error loading campaign:', error);
      toast?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Error al cargar la campaña' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="card">
            <h2>Campaña no encontrada</h2>
            <p className="text-600">La campaña solicitada no existe o no tienes permisos para acceder a ella.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <Toast ref={setToast} />
      <div className="col-12">
        <div className="card">
          <h2>Editar Campaña: {campaign.name}</h2>
          <p className="text-600 line-height-3 m-0">
            Modifique los datos de la campaña. Los cambios se aplicarán inmediatamente.
          </p>
        </div>
      </div>
      <div className="col-12">
        <CampaignForm 
          initialData={initialData}
          isEdit={true}
          campaignId={campaignId}
        />
      </div>
    </div>
  );
};

export default EditCampaignPage;
