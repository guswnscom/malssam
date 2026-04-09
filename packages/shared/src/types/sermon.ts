import type { WorshipType, SermonDepth, TargetAudience } from '../enums';

export interface GenerateSermonRequest {
  worshipType: WorshipType;
  targetDate: string;
  scripture: string;
  depth: SermonDepth;
  targetAudience: TargetAudience;
  specialInstruction?: string;
}

export interface SermonOutlinePoint {
  point: number;
  title: string;
  content: string;
}

export interface SermonCitation {
  id: string;
  type: 'REFERENCE' | 'BACKGROUND';
  author: string;
  title: string;
}

export interface SermonDraftResponse {
  id: string;
  sermonRequestId: string;
  title: string;
  scripture: string;
  summary: string;
  introduction: string;
  outline: SermonOutlinePoint[];
  application: string;
  conclusion: string;
  citations: SermonCitation[];
  regenerationCount: number;
  worshipType: string;
  targetDate: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SermonListItem {
  id: string;
  title: string;
  scripture: string;
  worshipType: string;
  targetDate: string;
  authorName: string;
  createdAt: string;
}

export interface RegenerateRequest {
  feedback: string;
  targetSection: 'FULL' | 'INTRODUCTION' | 'OUTLINE_1' | 'OUTLINE_2' | 'OUTLINE_3' | 'APPLICATION' | 'CONCLUSION';
}

export interface UpdateSermonRequest {
  title?: string;
  summary?: string;
  introduction?: string;
  outline?: SermonOutlinePoint[];
  application?: string;
  conclusion?: string;
}
