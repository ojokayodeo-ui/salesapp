export type UserRole = "owner" | "admin" | "sales_rep";
export type LeadSource = "cold" | "inbound" | "referral" | "form" | "csv" | "manual";
export type LeadStatus = "new" | "contacted" | "qualified" | "disqualified";
export type DealStatus = "open" | "won" | "lost";
export type DealPriority = "low" | "medium" | "high";
export type ActivityType = "email" | "call" | "meeting" | "note" | "task" | "stage_change";
export type ActivityStatus = "pending" | "completed" | "cancelled";
export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected";
export type AutomationTrigger = "stage_enter" | "stage_exit" | "time_delay" | "no_reply" | "deal_created" | "deal_won" | "deal_lost";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  organizationId: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  website?: string;
  phone?: string;
  title?: string;
  source: LeadSource;
  status: LeadStatus;
  tags: string[];
  notes?: string;
  linkedinUrl?: string;
  score: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  deals?: Deal[];
  activities?: Activity[];
}

export interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  organizationId: string;
  stages: Stage[];
  createdAt: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  pipelineId: string;
  deals?: Deal[];
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  expectedCloseDate?: string;
  status: DealStatus;
  priority: DealPriority;
  probability: number;
  notes?: string;
  lostReason?: string;
  stageId: string;
  stage?: Stage;
  leadId?: string;
  lead?: Lead;
  ownerId?: string;
  owner?: User;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  activities?: Activity[];
  proposals?: Proposal[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  direction?: "inbound" | "outbound";
  dueDate?: string;
  completedAt?: string;
  dealId?: string;
  deal?: Deal;
  leadId?: string;
  lead?: Lead;
  userId: string;
  user?: User;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  title: string;
  content: string;
  status: ProposalStatus;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  totalValue: number;
  validUntil?: string;
  dealId: string;
  deal?: Deal;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  triggerConfig: Record<string, unknown>;
  actions: AutomationAction[];
  isActive: boolean;
  executionCount: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationAction {
  type: "send_email" | "create_task" | "notify_rep" | "notify_team" | "move_stage" | "update_field";
  config: Record<string, unknown>;
}

// Analytics
export interface PipelineStats {
  totalDeals: number;
  totalValue: number;
  wonValue: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  avgDealSize: number;
  conversionRate: number;
  weightedPipeline: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  value: number;
  conversionFromPrev: number;
}

export interface RepPerformance {
  userId: string;
  name: string;
  dealsOpen: number;
  dealsWon: number;
  dealsLost: number;
  totalValue: number;
  wonValue: number;
  activities: number;
}

// Session
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId: string;
  };
}
