export interface Campaign {
  id: number;
  name: string;
  type: CampaignType;
  description?: string;
  agentGroupTag?: string;
  contactsCsvPath?: string;
  status: CampaignStatus;
  template: {
    id: number;
    name: string;
    textTemplate: string;
  };
  selectedAgents: Agent[];
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: number;
  name: string;
  mail: string;
}

export interface Contact {
  nombre: string;
  telefono: string;
  email?: string;
}

export enum CampaignType {
  WHATSAPP = 'whatsapp'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CampaignFormData {
  name: string;
  type: CampaignType;
  description: string;
  agentGroupTag: string;
  templateId: number | null;
  selectedAgentIds: number[];
  useAgentGroup: boolean;
}

export interface AgentGroup {
  id: number;
  name: string;
  tag: string;
  agents: Agent[];
}

export interface Template {
  id: number;
  name: string;
  textTemplate: string;
  statusTemplateWhatsapp: string;
}
