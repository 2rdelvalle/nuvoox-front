'use client';

import React from 'react';
import CampaignForm from '@/shared/components/campaign/CampaignForm';

const CreateCampaignPage = () => {
  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h2>Nueva Campaña</h2>
          <p className="text-600 line-height-3 m-0">
            Cree una nueva campaña de envío masivo vía WhatsApp utilizando plantillas previamente aprobadas.
          </p>
        </div>
      </div>
      <div className="col-12">
        <CampaignForm />
      </div>
    </div>
  );
};

export default CreateCampaignPage;
