export interface SubscriptionResponse {
  plan: string;
  status: string;
  trialStart: string;
  trialEnd: string;
  billingStart: string | null;
  monthlyPrice: number | null;
  maxPastors: number;
  maxSermonsMonth: number;
  cardLastFour: string | null;
  cardBrand: string | null;
  nextBillingDate: string | null;
}

export interface RegisterCardRequest {
  billingKey: string;
  cardLastFour: string;
  cardBrand: string;
}
