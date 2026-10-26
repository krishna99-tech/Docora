import { HttpClient, httpClient } from './http-client';
import { API_ROUTES } from '@/constants';
import { BusinessProfile, Customer, Template } from '@/types';

export class CustomerService {
  constructor(private http: HttpClient = httpClient) {}

  // Customers
  async listCustomers(params: Record<string, string | number> = {}): Promise<{ data: Customer[]; total: number }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = query ? `${API_ROUTES.CUSTOMERS.BASE}?${query}` : API_ROUTES.CUSTOMERS.BASE;
    return this.http.request<{ data: Customer[]; total: number }>(endpoint);
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.http.request<Customer>(API_ROUTES.CUSTOMERS.BY_ID(id));
  }

  async createCustomer(data: { name: string; email?: string; phone?: string; address?: string }): Promise<Customer> {
    return this.http.request<Customer>(API_ROUTES.CUSTOMERS.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: { name: string; email?: string; phone?: string; address?: string }): Promise<Customer> {
    return this.http.request<Customer>(API_ROUTES.CUSTOMERS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.http.request<void>(API_ROUTES.CUSTOMERS.BY_ID(id), { method: 'DELETE' });
  }

  // Business Profile
  async getBusinessProfile(): Promise<BusinessProfile> {
    return this.http.request<BusinessProfile>(API_ROUTES.SETTINGS.BUSINESS_PROFILE);
  }

  async updateBusinessProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return this.http.request<BusinessProfile>(API_ROUTES.SETTINGS.BUSINESS_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Templates
  async listTemplates(type?: string): Promise<Template[]> {
    const endpoint = type ? `${API_ROUTES.TEMPLATES.BASE}?type=${type}` : API_ROUTES.TEMPLATES.BASE;
    return this.http.request<Template[]>(endpoint);
  }

  async getTemplate(id: string): Promise<Template> {
    return this.http.request<Template>(API_ROUTES.TEMPLATES.BY_ID(id));
  }

  async createTemplate(data: Partial<Template>): Promise<Template> {
    return this.http.request<Template>(API_ROUTES.TEMPLATES.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
    return this.http.request<Template>(API_ROUTES.TEMPLATES.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async duplicateTemplate(id: string): Promise<Template> {
    return this.http.request<Template>(API_ROUTES.TEMPLATES.DUPLICATE(id), {
      method: 'POST',
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.http.request<void>(API_ROUTES.TEMPLATES.BY_ID(id), { method: 'DELETE' });
  }
}

export const customerService = new CustomerService();
