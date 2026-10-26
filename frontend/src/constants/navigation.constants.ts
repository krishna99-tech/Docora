export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  isExternal?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const APP_NAVIGATION: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' },
      { title: 'Analytics', href: '/analytics', iconName: 'BarChart3' },
    ],
  },
  {
    title: 'Documents & Billing',
    items: [
      { title: 'Invoices', href: '/invoices', iconName: 'FileText' },
      { title: 'Receipts', href: '/receipts', iconName: 'Receipt' },
      { title: 'Documents', href: '/documents', iconName: 'Files' },
      { title: 'PDF Generator', href: '/pdf-generator', iconName: 'Sparkles' },
      { title: 'PDF Tools', href: '/pdf-tools', iconName: 'Wrench' },
      { title: 'Templates', href: '/templates', iconName: 'LayoutTemplate' },
      { title: 'Customers', href: '/customers', iconName: 'Users' },
      { title: 'Bulk Jobs', href: '/bulk', iconName: 'Layers' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { title: 'Workflows', href: '/workflows', iconName: 'Workflow', badge: 'Pro' },
      { title: 'Workflow Studio', href: '/studio', iconName: 'GitBranch' },
      { title: 'Templates', href: '/workflows/templates', iconName: 'Boxes' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { title: 'Developer API', href: '/developer', iconName: 'Terminal' },
      { title: 'Verification', href: '/verification', iconName: 'CheckCircle2' },
      { title: 'Shared Links', href: '/shared', iconName: 'Share2' },
      { title: 'Feedback & Ideas', href: '/feedback', iconName: 'MessageSquare' },
      { title: 'Settings', href: '/settings', iconName: 'Settings' },
    ],
  },
];
