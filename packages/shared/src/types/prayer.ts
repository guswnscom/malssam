export interface CreatePrayerRequest {
  title: string;
  content: string;
}

export interface PrayerTopicResponse {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
