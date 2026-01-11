/**
 * Type definitions for Cursor usage data
 */

export interface UsageBreakdown {
  included: number;
  bonus: number;
  total: number;
}

export interface PlanUsage {
  enabled: boolean;
  used: number;
  limit: number;
  remaining: number;
  breakdown: UsageBreakdown;
  autoPercentUsed: number;
  apiPercentUsed: number;
  totalPercentUsed: number;
}

export interface OnDemandUsage {
  enabled: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface IndividualUsage {
  plan: PlanUsage;
  onDemand: OnDemandUsage;
}

export interface UsageSummary {
  billingCycleStart: string;
  billingCycleEnd: string;
  membershipType: string;
  limitType: string;
  isUnlimited: boolean;
  autoModelSelectedDisplayMessage: string;
  namedModelSelectedDisplayMessage: string;
  individualUsage: IndividualUsage;
  teamUsage: Record<string, any>;
}

export interface CursorCredentials {
  userId: string;
  accessToken: string;
  email?: string;
  membership?: string;
}

export interface FetchOptions {
  userAgent?: string;
  timeout?: number;
}

export interface MonthlyStats {
  year: number;
  month: number; // 1-12
  monthName: string;
  eventCount: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  models: Map<string, number>;
}
