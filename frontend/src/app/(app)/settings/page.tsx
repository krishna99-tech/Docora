'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Building2, Sliders, Moon, Sun, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useTheme, useAuth } from '@/app/providers';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [numberFormat, setNumberFormat] = useState('comma_period');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => api.getBusinessProfile(),
  });

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || '');
      setAddress(profile.address || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
      setTaxRegistrationNumber(profile.taxRegistrationNumber || '');
      setCurrency(profile.currency || 'USD');
      setDateFormat(profile.dateFormat || 'YYYY-MM-DD');
      setNumberFormat(profile.numberFormat || 'comma_period');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setError(null);

    try {
      await api.updateBusinessProfile({
        businessName,
        address,
        phone,
        email,
        taxRegistrationNumber,
        currency,
        dateFormat,
        numberFormat,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Settings"
        description="Configure your business identity, default document currency, and appearance"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        {savedSuccess && (
          <div className="p-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Business settings saved successfully.</span>
          </div>
        )}

        {error && (
          <div className="p-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Business Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--muted-foreground)]" />
                <CardTitle>Business Profile & Header Details</CardTitle>
              </div>
              <CardDescription>
                This information appears on generated receipts, invoices, and official PDFs
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Legal Business / Issuer Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Corporation LLC"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                  Registered Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="100 Financial Way, Floor 12, New York, NY 10005"
                  className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                />
              </div>

              <Input
                label="Public Business Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (800) 555-0199"
              />

              <Input
                label="Invoice Contact Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@acme.com"
                helperText="Displayed in PDF footer for inquiries; no emails are dispatched"
              />

              <Input
                label="Tax Identification / Registration No."
                value={taxRegistrationNumber}
                onChange={(e) => setTaxRegistrationNumber(e.target.value)}
                placeholder="e.g. US-EIN-12-3456789"
              />
            </div>
          </Card>

          {/* Localization & Formatting */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--muted-foreground)]" />
                <CardTitle>Document Defaults & Regional Formatting</CardTitle>
              </div>
              <CardDescription>
                Configure default values for automated monetary and date formatting
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                  Date Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                  Number Format
                </label>
                <select
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                >
                  <option value="comma_period">1,234.56 (Standard)</option>
                  <option value="period_comma">1.234,56 (European)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Theme Preference */}
          <Card>
            <CardHeader>
              <CardTitle>Interface Appearance</CardTitle>
              <CardDescription>Toggle between high-contrast monochrome light and dark modes</CardDescription>
            </CardHeader>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-[var(--foreground)]">Current Theme</div>
                <div className="text-xs text-[var(--muted-foreground)] capitalize">{theme} mode active</div>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 mr-1.5" />
                    Switch to Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 mr-1.5" />
                    Switch to Light Mode
                  </>
                )}
              </Button>
            </div>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="default" isLoading={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1" />
              Save Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
