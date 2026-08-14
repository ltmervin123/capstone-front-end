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

export interface UpdateFeedbackStatusPayload {
  status: FeedbackItem['status'];
}

export interface ReplyFeedbackPayload {
  adminResponse: string;
  status: FeedbackItem['status'];
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

  async updateFeedbackStatus(id: string, payload: UpdateFeedbackStatusPayload): Promise<FeedbackItem> {
    const response = await apiRequest<ApiSuccessResponse<FeedbackPayload>>(
      `/feedback/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );

    return response.data.record;
  },

  async replyToFeedback(id: string, payload: ReplyFeedbackPayload): Promise<FeedbackItem> {
    const response = await apiRequest<ApiSuccessResponse<FeedbackPayload>>(
      `/feedback/${encodeURIComponent(id)}/reply`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );

    return response.data.record;
  },

  async deleteFeedback(id: string): Promise<{ id: string }> {
    const response = await apiRequest<ApiSuccessResponse<{ id: string }>>(
      `/feedback/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    );

    return response.data;
  },

  async markNotificationsRead(): Promise<{ count: number }> {
    const response = await apiRequest<ApiSuccessResponse<{ count: number }>>(
      '/feedback/notifications/read',
      {
        method: 'PATCH',
      },
    );

    return response.data;
  },
};
