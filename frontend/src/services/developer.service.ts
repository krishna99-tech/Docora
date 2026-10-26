import { HttpClient, httpClient } from './http-client';
import { API_ROUTES } from '@/constants';
import { ApiKey, Webhook, WebhookDelivery } from '@/types';

export class DeveloperService {
  constructor(private http: HttpClient = httpClient) {}

  async listApiKeys(): Promise<ApiKey[]> {
    return this.http.request<ApiKey[]>(API_ROUTES.DEVELOPER.API_KEYS);
  }

  async createApiKey(data: { name: string; permissions: string[] }): Promise<ApiKey> {
    return this.http.request<ApiKey>(API_ROUTES.DEVELOPER.API_KEYS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeApiKey(id: string): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(`${API_ROUTES.DEVELOPER.API_KEYS}/${id}`, {
      method: 'DELETE',
    });
  }

  async listWebhooks(): Promise<Webhook[]> {
    return this.http.request<Webhook[]>(API_ROUTES.DEVELOPER.WEBHOOKS);
  }

  async createWebhook(data: { targetUrl: string; events: string[]; secret?: string }): Promise<Webhook> {
    return this.http.request<Webhook>(API_ROUTES.DEVELOPER.WEBHOOKS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(`${API_ROUTES.DEVELOPER.WEBHOOKS}/${id}`, {
      method: 'DELETE',
    });
  }

  async listWebhookDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    return this.http.request<WebhookDelivery[]>(`${API_ROUTES.DEVELOPER.WEBHOOKS}/${webhookId}/deliveries`);
  }

  async testWebhook(webhookId: string, eventType?: string): Promise<WebhookDelivery> {
    return this.http.request<WebhookDelivery>(`${API_ROUTES.DEVELOPER.WEBHOOKS}/${webhookId}/test`, {
      method: 'POST',
      body: JSON.stringify({ eventType }),
    });
  }
}

export const developerService = new DeveloperService();
