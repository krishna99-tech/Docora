'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Users, Mail, Phone, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Customer } from '@/types';
import { formatDate } from '@/lib/utils';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers-list', search, page],
    queryFn: () => api.listCustomers({ search, page, pageSize: 15 }),
  });

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, { name, email, phone, address });
      } else {
        await api.createCustomer({ name, email, phone, address });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer record?')) return;
    try {
      await api.deleteCustomer(id);
      refetch();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Customer Directory"
        description="Maintain customer profiles, billing addresses, and contact references"
        action={{ label: 'New Customer', onClick: openCreateModal }}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Search */}
        <div className="flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by customer name, email, or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <Card className="p-0 overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Billing Address</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--muted-foreground)]">
                      Loading customers...
                    </td>
                  </tr>
                ) : !data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Users className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
                      <p className="font-semibold text-sm">No customers recorded yet</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Add clients to easily autofill receipts and invoices.
                      </p>
                      <Button size="sm" variant="default" onClick={openCreateModal} className="mt-4">
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add First Customer
                      </Button>
                    </td>
                  </tr>
                ) : (
                  data.data.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4 font-bold">{c.name}</td>
                      <td className="py-3 px-4 text-[var(--muted-foreground)]">{c.email || '—'}</td>
                      <td className="py-3 px-4 text-[var(--muted-foreground)]">{c.phone || '—'}</td>
                      <td className="py-3 px-4 truncate max-w-xs">{c.address || '—'}</td>
                      <td className="py-3 px-4 text-[var(--muted-foreground)]">{formatDate(c.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(c)}
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(c.id)}
                            title="Delete Customer"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile Customer Cards (< 640px) */}
        <div className="sm:hidden space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-xs text-[var(--muted-foreground)]">
              Loading customers...
            </Card>
          ) : !data || data.data.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
              <p className="font-semibold text-xs">No customers recorded yet</p>
              <Button size="sm" variant="default" onClick={openCreateModal} className="mt-3">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Customer
              </Button>
            </Card>
          ) : (
            data.data.map((c) => (
              <Card key={c.id} className="p-4 space-y-2 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--foreground)]">{c.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => openEditModal(c)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
                  {c.email && <div>Email: {c.email}</div>}
                  {c.phone && <div>Phone: {c.phone}</div>}
                  {c.address && <div className="truncate">Address: {c.address}</div>}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        description="Store contact and billing details for recurring receipts and invoices"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
              {error}
            </div>
          )}

          <Input
            label="Customer or Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Globex Corp / Sarah Jenkins"
            required
            autoFocus
          />

          <Input
            label="Email Address (Contact Information)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="billing@globex.com"
            helperText="Stored for reference; no emails will be sent by the platform"
          />

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 019-2834"
          />

          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
              Billing Address
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Corporate Blvd, Suite 400, Austin, TX 78701"
              className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
