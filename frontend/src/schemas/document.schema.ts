import { z } from 'zod';

export const itemInputSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPriceMinor: z.number().nonnegative('Unit price cannot be negative'),
  discountMinor: z.number().nonnegative('Discount cannot be negative').default(0),
  taxRate: z.number().nonnegative('Tax rate cannot be negative').default(0),
});

export const createReceiptSchema = z.object({
  customerId: z.string().optional(),
  documentNumber: z.string().optional(),
  title: z.string().optional(),
  currency: z.string().default('USD'),
  issueDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  amountPaidMinor: z.number().nonnegative('Amount paid cannot be negative'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  templateVersionId: z.string().optional(),
  items: z.array(itemInputSchema).min(1, 'At least one line item is required'),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().optional(),
  documentNumber: z.string().optional(),
  title: z.string().optional(),
  currency: z.string().default('USD'),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  amountPaidMinor: z.number().nonnegative('Amount paid cannot be negative').default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  templateVersionId: z.string().optional(),
  items: z.array(itemInputSchema).min(1, 'At least one line item is required'),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const businessProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  taxRegistrationNumber: z.string().optional(),
  currency: z.string().default('USD'),
  dateFormat: z.string().default('YYYY-MM-DD'),
  numberFormat: z.string().default('en-US'),
});

export type ItemInputFormData = z.infer<typeof itemInputSchema>;
export type CreateReceiptFormData = z.infer<typeof createReceiptSchema>;
export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;
