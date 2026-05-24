export type Clinic = {
  id: string;
  name: string;
  brandName?: string;
  logoUrl?: string;
  slug: string;
  document: string;
  email: string;
  phone: string;
  zipCode: string;
  city: string;
  state: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
};

export type Patient = {
  id: string;
  clinicId: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: Date;
  document: string;
  zipCode: string;
  city: string;
  state: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
};

export type MembershipPlan = {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  active: boolean;
  createdAt: Date;
};

export type MembershipBenefit = {
  id: string;
  membershipPlanId: string;
  type:
    | "FREE"
    | "PERCENTAGE_DISCOUNT"
    | "FIXED_DISCOUNT"
    | "LIMITED";

  title: string;
  description?: string;

  discountPercentage?: number;
  discountAmount?: number;

  usageLimit?: number;

  resetPeriod?: "MONTHLY" | "YEARLY";

  createdAt: Date;
};

export type Subscription = {
  id: string;
  patientId: string;
  membershipPlanId: string;

  status:
    | "ACTIVE"
    | "PENDING"
    | "OVERDUE"
    | "CANCELED"
    | "EXPIRED";

  startedAt: Date;
  expiresAt?: Date;
  canceledAt?: Date;
};

export type BenefitUsage = {
  id: string;
  subscriptionId: string;
  membershipBenefitId: string;

  usedBy: string;

  usedAt: Date;

  notes?: string;
};