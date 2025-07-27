export interface Campaign {
  id?: number;
  name: string;
  type: CampaignType;
  description: string;
  agentGroupTag?: string;
  templateId: number;
  selectedAgentIds: number[];
  contactsCsvPath?: string;
  totalContacts?: number;
  sentMessages?: number;
  status?: string;
  template?: {
    id: number;
    name: string;
    textTemplate: string;
  };
  selectedAgents?: Agent[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CampaignProgress {
  campaignId: number;
  totalContacts: number;
  sentMessages: number;
  status: 'procesando' | 'completado' | 'fallida';
  progressPercentage: number;
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
  DRAFT = 'borrador',
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
