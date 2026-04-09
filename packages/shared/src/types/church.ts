import type { ChurchSize, SermonStyle, CongregationType, WorshipType, Role } from '../enums';

export interface CreateChurchRequest {
  name: string;
  sizeCategory: ChurchSize;
  worshipTypes: WorshipType[];
  sermonStyle: SermonStyle;
  congregationType: CongregationType;
}

export interface JoinChurchRequest {
  role: Role;
}

export interface ChurchResponse {
  church: {
    id: string;
    name: string;
    inviteCode: string;
    sizeCategory: string;
  };
  profile: {
    sermonStyle: string;
    congregationType: string;
    worshipTypes: string[];
  };
  subscription: {
    plan: string;
    status: string;
    trialEnd: string;
  };
  membership: {
    role: string;
  };
}

export interface MemberResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}
