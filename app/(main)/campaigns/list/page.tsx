'use client';

import React from 'react';
import CampaignList from '@/shared/components/campaign/CampaignList';

const CampaignListPage = () => {
  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h2>Gestión de Campañas</h2>
          <p className="text-600 line-height-3 m-0">
            Administre sus campañas de envío masivo vía WhatsApp. Cree, edite y monitoree el estado de sus campañas.
          </p>
        </div>
      </div>
      <div className="col-12">
        <CampaignList />
      </div>
    </div>
  );
};

export default CampaignListPage;
