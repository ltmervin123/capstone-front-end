import type { FeedbackItem } from '../types/types';
import { apiRequest, type ApiSuccessResponse } from '../utils/apiClient';

interface FeedbackListPayload {
  records: FeedbackItem[];
}

interface FeedbackPayload {
  record: FeedbackItem;
}

export interface CreateFeedbackPayload {
  category: string;
  subject: string;
  message: string;
  isAnonymous: boolean;
}

export const feedbackService = {
  async listFeedback(): Promise<FeedbackItem[]> {
    const response = await apiRequest<ApiSuccessResponse<FeedbackListPayload>>('/feedback');
    return response.data.records;
  },

  async createFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem> {
    const response = await apiRequest<ApiSuccessResponse<FeedbackPayload>>('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.data.record;
  },
};
