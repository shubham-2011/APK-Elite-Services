'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  Home,
  Building,
  Mail,
  SlidersHorizontal,
  FileText,
  Save,
  Check,
  Tag,
  DollarSign,
  HelpCircle,
  Settings2,
  Footprints,
  Users,
  Globe,
  Laptop,
  Smartphone,
  Tablet,
  Eye,
  Activity,
  MousePointerClick,
  TrendingUp,
} from 'lucide-react';
import { DEFAULT_SITE_CONTENT, SiteContentData } from '@/lib/content-types';

interface Note {
  note: string;
  author?: string;
  createdAt: string;
}

interface LeadItem {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  locality?: string;
  propertyType?: string;
  message?: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'CONFIRMED' | 'COMPLETED' | 'LOST';
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  totalLeads: number;
  todayLeads: number;
  totalFootmarks?: number;
  todayFootmarks?: number;
  statusMap: Record<string, number>;
  topLocalities: { locality: string; count: number }[];
  topServices: { service: string; count: number }[];
}

export interface FootmarkItem {
  _id: string;
  visitorId: string;
  sessionId: string;
  path: string;
  pageTitle: string;
  referrer: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os?: string;
  city: string;
  createdAt: string;
}

export interface FootmarkStats {
  totalFootmarks: number;
  uniqueVisitors: number;
  todayFootmarks: number;
  todayUniqueVisitors: number;
  topPages: { path: string; title: string; count: number; percentage: number }[];
  deviceCounts: { mobile: number; desktop: number; tablet: number };
  topReferrers: { referrer: string; count: number }[];
  recentFootmarks: FootmarkItem[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  CONTACTED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  QUOTE_SENT: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  CONFIRMED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  COMPLETED: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  LOST: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function CMSDashboard() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'leads' | 'footmarks' | 'form' | 'content'>('leads');

  // Leads state
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Footmarks state
  const [footmarkStats, setFootmarkStats] = useState<FootmarkStats | null>(null);
  const [footmarkSearch, setFootmarkSearch] = useState('');
  const [simulatingFootmark, setSimulatingFootmark] = useState(false);

  // Content & Form Settings state
  const [siteContent, setSiteContent] = useState<SiteContentData>(DEFAULT_SITE_CONTENT);
  const [savingContent, setSavingContent] = useState(false);
  const [contentSaveSuccess, setContentSaveSuccess] = useState(false);

  // Form Controls local edit state
  const [newLocalityInput, setNewLocalityInput] = useState('');
  const [newServiceInput, setNewServiceInput] = useState('');

  // Leads Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [localityFilter, setLocalityFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');

  // Selected Lead Modal
  const [activeLead, setActiveLead] = useState<LeadItem | null>(null);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // New Lead Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Deep Cleaning',
    locality: 'Baner',
    propertyType: '2 BHK',
    message: '',
  });
  const [submittingNewLead, setSubmittingNewLead] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const [leadsRes, statsRes, contentRes, footmarkRes] = await Promise.all([
        fetch('/api/leads?limit=200'),
        fetch('/api/stats'),
        fetch('/api/content'),
        fetch('/api/footmark'),
      ]);

      const leadsJson = await leadsRes.json();
      const statsJson = await statsRes.json();
      const contentJson = await contentRes.json();
      const footmarkJson = await footmarkRes.json();

      if (leadsJson.success) setLeads(leadsJson.leads || []);
      if (statsJson.success) setStats(statsJson.stats);
      if (contentJson.success && contentJson.content) {
        setSiteContent(contentJson.content);
      }
      if (footmarkJson.success && footmarkJson.stats) {
        setFootmarkStats(footmarkJson.stats);
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Could not connect to API or Database. Ensure dev server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSimulateFootmark = async () => {
    try {
      setSimulatingFootmark(true);
      const testPages = [
        { path: '/', title: 'APK Elite Services | Professional Cleaning in Pune' },
        { path: '/services/deep-cleaning', title: 'Home Deep Cleaning Services in Pune' },
        { path: '/services/sofa-cleaning', title: 'Professional Sofa & Carpet Shampooing Pune' },
        { path: '/services/office-cleaning', title: 'Corporate Office Cleaning & AMC Pune' },
        { path: '/services/water-tank-cleaning', title: 'Water Tank Cleaning Services Pune' },
        { path: '/contact', title: 'Contact Us | Request Free Quote' },
      ];
      const pick = testPages[Math.floor(Math.random() * testPages.length)];
      const devices: ('mobile' | 'desktop')[] = ['mobile', 'desktop'];
      const referrers = ['Google Search', 'WhatsApp', 'Direct', 'Instagram'];
      const cities = ['Wakad, Pune', 'Baner, Pune', 'Hinjewadi, Pune', 'Kharadi, Pune', 'Kothrud, Pune'];

      await fetch('/api/footmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: 'vis_' + Math.random().toString(36).substring(2, 8),
          sessionId: 'sess_' + Math.random().toString(36).substring(2, 8),
          path: pick.path,
          pageTitle: pick.title,
          referrer: referrers[Math.floor(Math.random() * referrers.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: 'Chrome',
          city: cities[Math.floor(Math.random() * cities.length)],
        }),
      });

      await fetchData();
    } catch (err) {
      console.error('Failed to simulate footmark:', err);
    } finally {
      setSimulatingFootmark(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Content & Form Settings
  const handleSaveContent = async () => {
    try {
      setSavingContent(true);
      setContentSaveSuccess(false);

      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteContent),
      });

      const data = await res.json();
      if (data.success) {
        setContentSaveSuccess(true);
        setTimeout(() => setContentSaveSuccess(false), 4000);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch {
      alert('Error connecting to server to save settings.');
    } finally {
      setSavingContent(false);
    }
  };

  // Add/Remove Localities in Form Config
  const handleAddLocality = () => {
    if (!newLocalityInput.trim()) return;
    const trimmed = newLocalityInput.trim();
    if (!siteContent.formConfig.localities.includes(trimmed)) {
      setSiteContent({
        ...siteContent,
        formConfig: {
          ...siteContent.formConfig,
          localities: [...siteContent.formConfig.localities, trimmed],
        },
      });
    }
    setNewLocalityInput('');
  };

  const handleRemoveLocality = (loc: string) => {
    setSiteContent({
      ...siteContent,
      formConfig: {
        ...siteContent.formConfig,
        localities: siteContent.formConfig.localities.filter((l) => l !== loc),
      },
    });
  };

  // Add/Remove Services in Form Config
  const handleAddService = () => {
    if (!newServiceInput.trim()) return;
    const trimmed = newServiceInput.trim();
    if (!siteContent.formConfig.services.includes(trimmed)) {
      setSiteContent({
        ...siteContent,
        formConfig: {
          ...siteContent.formConfig,
          services: [...siteContent.formConfig.services, trimmed],
        },
      });
    }
    setNewServiceInput('');
  };

  const handleRemoveService = (srv: string) => {
    setSiteContent({
      ...siteContent,
      formConfig: {
        ...siteContent.formConfig,
        services: siteContent.formConfig.services.filter((s) => s !== srv),
      },
    });
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false;
      if (localityFilter !== 'All' && !lead.locality?.toLowerCase().includes(localityFilter.toLowerCase())) return false;
      if (serviceFilter !== 'All' && !lead.service?.toLowerCase().includes(serviceFilter.toLowerCase())) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(query);
        const matchesPhone = lead.phone.includes(query);
        const matchesEmail = lead.email?.toLowerCase().includes(query);
        const matchesLocality = lead.locality?.toLowerCase().includes(query);
        const matchesService = lead.service.toLowerCase().includes(query);
        const matchesMessage = lead.message?.toLowerCase().includes(query);
        return matchesName || matchesPhone || matchesEmail || matchesLocality || matchesService || matchesMessage;
      }

      return true;
    });
  }, [leads, statusFilter, localityFilter, serviceFilter, search]);

  // Filtered Footmarks
  const filteredFootmarks = useMemo(() => {
    if (!footmarkStats?.recentFootmarks) return [];
    if (!footmarkSearch.trim()) return footmarkStats.recentFootmarks;
    const q = footmarkSearch.toLowerCase().trim();
    return footmarkStats.recentFootmarks.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.pageTitle.toLowerCase().includes(q) ||
        f.referrer.toLowerCase().includes(q) ||
        f.device.toLowerCase().includes(q) ||
        (f.city && f.city.toLowerCase().includes(q)) ||
        f.visitorId.toLowerCase().includes(q)
    );
  }, [footmarkStats, footmarkSearch]);


  // Update Status
  const handleUpdateStatus = async (leadId: string, newStatus: LeadItem['status']) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: `Status updated to ${newStatus}`,
          author: 'Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.map((l) => (l._id === leadId ? data.lead : l)));
        if (activeLead && activeLead._id === leadId) setActiveLead(data.lead);
      }
    } catch {
      alert('Failed to update status');
    }
  };

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !newNote.trim()) return;

    try {
      setSavingNote(true);
      const res = await fetch(`/api/leads/${activeLead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim(), author: 'Admin' }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveLead(data.lead);
        setLeads((prev) => prev.map((l) => (l._id === activeLead._id ? data.lead : l)));
        setNewNote('');
      }
    } catch {
      alert('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
        if (activeLead?._id === leadId) setActiveLead(null);
      }
    } catch {
      alert('Failed to delete lead');
    }
  };

  // Create Manual Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.phone) {
      alert('Name and phone are required');
      return;
    }

    try {
      setSubmittingNewLead(true);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLeadForm, source: 'cms_manual' }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewLeadForm({
          name: '',
          phone: '',
          email: '',
          service: 'Deep Cleaning',
          locality: 'Baner',
          propertyType: '2 BHK',
          message: '',
        });
        fetchData();
      } else {
        alert(data.error || 'Failed to create lead');
      }
    } catch {
      alert('Failed to create lead');
    } finally {
      setSubmittingNewLead(false);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (!filteredLeads.length) return alert('No leads to export');

    const headers = ['Date', 'Customer Name', 'Phone', 'Email', 'Service', 'Locality', 'Property Type', 'Status', 'Source', 'Message'];
    const rows = filteredLeads.map((l) => [
      new Date(l.createdAt).toLocaleDateString('en-IN'),
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.service}"`,
      `"${l.locality || ''}"`,
      `"${l.propertyType || ''}"`,
      `"${l.status}"`,
      `"${l.source}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apk-elite-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">APK Elite Services</h1>
                <span className="text-xs text-slate-500 font-medium">Control Center & CMS</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 border border-slate-200 p-1 rounded-xl bg-slate-50 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'leads' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-brand-600" />
                <span>Leads & Inquiries</span>
                {leads.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px]">
                    {leads.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('footmarks')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'footmarks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Footprints className="w-3.5 h-3.5 text-indigo-600" />
                <span>Footmarks & Visitors</span>
                {(footmarkStats?.todayFootmarks ?? stats?.todayFootmarks ?? 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                    +{footmarkStats?.todayFootmarks ?? stats?.todayFootmarks} today
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                <span>Form & Field Controls</span>
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'content' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Website Content & Pricing</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {activeTab === 'footmarks' && (
              <button
                onClick={handleSimulateFootmark}
                disabled={simulatingFootmark}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                title="Simulate visitor for live testing"
              >
                <Footprints className={`w-3.5 h-3.5 ${simulatingFootmark ? 'animate-bounce' : ''}`} />
                <span>{simulatingFootmark ? 'Simulating...' : 'Simulate Visit'}</span>
              </button>
            )}

            {activeTab === 'leads' && (
              <>
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
                  title="Download CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Lead</span>
                </button>
              </>
            )}

            {(activeTab === 'form' || activeTab === 'content') && (
              <button
                onClick={handleSaveContent}
                disabled={savingContent}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingContent ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex border-t border-slate-200 bg-slate-50 px-2 py-2 space-x-1 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-2.5 py-1.5 rounded-lg text-center whitespace-nowrap ${activeTab === 'leads' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-600'}`}
          >
            Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('footmarks')}
            className={`px-2.5 py-1.5 rounded-lg text-center whitespace-nowrap ${activeTab === 'footmarks' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}
          >
            Footmarks ({footmarkStats?.totalFootmarks ?? stats?.totalFootmarks ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`px-2.5 py-1.5 rounded-lg text-center whitespace-nowrap ${activeTab === 'form' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-600'}`}
          >
            Form
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-2.5 py-1.5 rounded-lg text-center whitespace-nowrap ${activeTab === 'content' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600'}`}
          >
            Content
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Success Alert for Content Save */}
        {contentSaveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center space-x-3 shadow-sm">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold">Configuration and form controls saved successfully!</p>
          </div>
        )}

        {/* TAB 1: LEADS & INQUIRIES */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalLeads ?? leads.length}</p>
                  <span className="text-xs text-blue-600 font-medium mt-1 inline-block">All Channels</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">New Today</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.todayLeads ?? 0}</p>
                  <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Incoming</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Quotes Sent</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.statusMap?.QUOTE_SENT ?? 0}</p>
                  <span className="text-xs text-purple-600 font-medium mt-1 inline-block">In Negotiation</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Completed Jobs</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.statusMap?.COMPLETED ?? 0}</p>
                  <span className="text-xs text-teal-600 font-medium mt-1 inline-block">Delivered</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('footmarks')}
                className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-5 rounded-2xl border border-indigo-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:shadow-md transition col-span-2 sm:col-span-1"
                title="Click to view visitor footmarks analytics"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <Footprints className="w-3.5 h-3.5" /> Footmarks
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{footmarkStats?.totalFootmarks ?? stats?.totalFootmarks ?? 0}</p>
                  <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">
                    +{footmarkStats?.todayFootmarks ?? stats?.todayFootmarks ?? 0} today &rarr;
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Footprints className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, locality, message..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-700"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NEW">New Inquiries</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUOTE_SENT">Quote Sent</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                {/* Locality Filter */}
                <div>
                  <select
                    value={localityFilter}
                    onChange={(e) => setLocalityFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-700"
                  >
                    <option value="All">All Localities</option>
                    {siteContent.formConfig.localities.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Service Filter */}
                <div>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-700"
                  >
                    <option value="All">All Services</option>
                    {siteContent.formConfig.services.map((srv) => (
                      <option key={srv} value={srv}>{srv}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">
                  Customer Leads & Quotes ({filteredLeads.length})
                </h2>
                <span className="text-xs text-slate-500">Click any row for notes & full history</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Contact Details</th>
                      <th className="px-6 py-3.5">Service & Locality</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Instant Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                          Loading customer inquiries...
                        </td>
                      </tr>
                    ) : filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          No leads match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => {
                        const statusStyle = STATUS_COLORS[lead.status] || STATUS_COLORS.NEW;
                        const dateFormatted = new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
                        const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
                        const waText = encodeURIComponent(
                          `Hi ${lead.name}, this is APK Elite Services Pune regarding your inquiry for ${lead.service} in ${lead.locality || 'Pune'}. How can we assist you with a quote?`
                        );

                        return (
                          <tr
                            key={lead._id}
                            onClick={() => setActiveLead(lead)}
                            className="hover:bg-slate-50/80 cursor-pointer transition"
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">{lead.name}</div>
                              {lead.propertyType && (
                                <span className="text-xs text-slate-500 inline-flex items-center gap-1 mt-0.5">
                                  <Home className="w-3 h-3 text-slate-400" /> {lead.propertyType}
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 space-y-1">
                              <div className="font-medium text-slate-700 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}
                              </div>
                              {lead.email && (
                                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-800">{lead.service}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-brand-500" /> {lead.locality || 'Pune'}
                              </div>
                            </td>

                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateStatus(lead._id, e.target.value as LeadItem['status'])}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer`}
                              >
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="QUOTE_SENT">Quote Sent</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="LOST">Lost</option>
                              </select>
                            </td>

                            <td className="px-6 py-4 text-xs text-slate-500">{dateFormatted}</td>

                            <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={`https://wa.me/${waPhone}?text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition shadow-sm"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>

                              <a
                                href={`tel:${lead.phone}`}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm"
                                title="Call Customer"
                              >
                                <Phone className="w-4 h-4" />
                              </a>

                              <button
                                onClick={() => setActiveLead(lead)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition shadow-sm"
                                title="View / Edit Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FOOTMARKS & VISITOR ANALYTICS */}
        {activeTab === 'footmarks' && (
          <div className="space-y-6">
            {/* Header / Action Bar */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-indigo-600" />
                    Website Footmarks & Visitor Traffic
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Tracking Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time anonymous visitor tracking, page views, device metrics, and traffic acquisition across Pune.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateFootmark}
                  disabled={simulatingFootmark}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  title="Simulate visitor for live testing"
                >
                  <Footprints className={`w-4 h-4 ${simulatingFootmark ? 'animate-bounce' : ''}`} />
                  <span>{simulatingFootmark ? 'Simulating...' : 'Simulate Test Visit'}</span>
                </button>

                <button
                  onClick={() => fetchData()}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Footmarks</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{footmarkStats?.totalFootmarks ?? 0}</p>
                  <span className="text-xs text-indigo-600 font-medium mt-1 inline-block">All-Time Pageviews</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Unique Visitors</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{footmarkStats?.uniqueVisitors ?? 0}</p>
                  <span className="text-xs text-blue-600 font-medium mt-1 inline-block">Distinct Client Devices</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Today&apos;s Footmarks</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{footmarkStats?.todayFootmarks ?? 0}</p>
                  <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
                    {footmarkStats?.todayUniqueVisitors ?? 0} unique today
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Top Service Page</p>
                  <p className="text-base font-bold text-slate-900 mt-1 truncate max-w-[150px]" title={footmarkStats?.topPages?.[0]?.title || 'Homepage'}>
                    {footmarkStats?.topPages?.[0]?.title || 'Homepage'}
                  </p>
                  <span className="text-xs text-purple-600 font-medium mt-1 inline-block">
                    {footmarkStats?.topPages?.[0]?.count ?? 0} views ({footmarkStats?.topPages?.[0]?.percentage ?? 0}%)
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Visual Breakdown Grid: Top Pages & Device/Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Visited Pages & Services */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-brand-600" />
                    Top Visited Pages & Service Offerings
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Traffic Share</span>
                </div>

                <div className="space-y-3">
                  {footmarkStats?.topPages && footmarkStats.topPages.length > 0 ? (
                    footmarkStats.topPages.map((page, idx) => (
                      <div key={page.path} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate max-w-[75%]">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px] flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800 truncate" title={page.title}>
                              {page.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{page.path}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-slate-900">{page.count} visits</span>
                            <span className="text-[11px] font-semibold text-slate-500 w-8 text-right">
                              {page.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-purple-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.max(page.percentage, 4)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No page traffic recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Device Split & Traffic Acquisition */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                {/* Device Distribution */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      Device Distribution
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hardware Split</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <Smartphone className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                      <p className="text-xs font-bold text-slate-800">Mobile</p>
                      <p className="text-lg font-extrabold text-indigo-600">{footmarkStats?.deviceCounts?.mobile ?? 0}</p>
                      <p className="text-[10px] text-slate-500">
                        {footmarkStats?.totalFootmarks
                          ? Math.round(((footmarkStats.deviceCounts.mobile || 0) / footmarkStats.totalFootmarks) * 100)
                          : 0}
                        % of visits
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <Laptop className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                      <p className="text-xs font-bold text-slate-800">Desktop</p>
                      <p className="text-lg font-extrabold text-blue-600">{footmarkStats?.deviceCounts?.desktop ?? 0}</p>
                      <p className="text-[10px] text-slate-500">
                        {footmarkStats?.totalFootmarks
                          ? Math.round(((footmarkStats.deviceCounts.desktop || 0) / footmarkStats.totalFootmarks) * 100)
                          : 0}
                        % of visits
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <Tablet className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                      <p className="text-xs font-bold text-slate-800">Tablet</p>
                      <p className="text-lg font-extrabold text-purple-600">{footmarkStats?.deviceCounts?.tablet ?? 0}</p>
                      <p className="text-[10px] text-slate-500">
                        {footmarkStats?.totalFootmarks
                          ? Math.round(((footmarkStats.deviceCounts.tablet || 0) / footmarkStats.totalFootmarks) * 100)
                          : 0}
                        % of visits
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acquisition Referrers */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      Traffic Sources & Referrals
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Channels</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {footmarkStats?.topReferrers && footmarkStats.topReferrers.length > 0 ? (
                      footmarkStats.topReferrers.map((ref) => (
                        <div
                          key={ref.referrer}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
                        >
                          <span className="font-semibold text-slate-900">{ref.referrer}:</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-indigo-700 text-[11px]">
                            {ref.count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No referrer data available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Footmark Activity Stream */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-indigo-600" />
                    Live Footmark Activity Stream
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recent visitor journeys, page paths, and client footprints.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={footmarkSearch}
                    onChange={(e) => setFootmarkSearch(e.target.value)}
                    placeholder="Filter page, device, city, source..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="px-4 sm:px-6 py-3">Page Visited</th>
                      <th className="px-4 sm:px-6 py-3">Visitor & Device</th>
                      <th className="px-4 sm:px-6 py-3">Referrer Source</th>
                      <th className="px-4 sm:px-6 py-3">Location</th>
                      <th className="px-4 sm:px-6 py-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFootmarks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                          No footmark records match your search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredFootmarks.map((f) => {
                        const isToday = new Date(f.createdAt).toDateString() === new Date().toDateString();
                        const timeStr = new Date(f.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const dateStr = new Date(f.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        });

                        return (
                          <tr key={f._id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 sm:px-6 py-3.5">
                              <div className="flex items-start gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                                    isToday ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                                  }`}
                                  title={isToday ? 'Visited today' : 'Earlier visit'}
                                ></span>
                                <div>
                                  <p className="font-semibold text-slate-900">{f.pageTitle || 'APK Elite Services'}</p>
                                  <p className="text-[10px] text-indigo-600 font-mono">{f.path}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 sm:px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-slate-100 text-slate-600">
                                  {f.device === 'mobile' ? (
                                    <Smartphone className="w-3.5 h-3.5" />
                                  ) : f.device === 'tablet' ? (
                                    <Tablet className="w-3.5 h-3.5" />
                                  ) : (
                                    <Laptop className="w-3.5 h-3.5" />
                                  )}
                                </span>
                                <div>
                                  <p className="font-semibold text-slate-800 capitalize">
                                    {f.device} · {f.browser}
                                  </p>
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                    {f.visitorId.slice(0, 10)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 sm:px-6 py-3.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                                  f.referrer.includes('Google')
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : f.referrer.includes('WhatsApp')
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : f.referrer.includes('Instagram')
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {f.referrer}
                              </span>
                            </td>

                            <td className="px-4 sm:px-6 py-3.5 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {f.city || 'Pune'}
                              </span>
                            </td>

                            <td className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">
                              <p className="font-semibold text-slate-900">{timeStr}</p>
                              <p className="text-[10px] text-slate-400">{dateStr}</p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FORM & FIELD CONTROLS */}
        {activeTab === 'form' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                    Quote & Contact Form Controls
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Changes made here directly control the form fields, options, and contact destinations on the live site.
                  </p>
                </div>

                <button
                  onClick={handleSaveContent}
                  disabled={savingContent}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingContent ? 'Saving...' : 'Save Form Controls'}</span>
                </button>
              </div>

              {/* Form Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quote Modal Title</label>
                  <input
                    type="text"
                    value={siteContent.formConfig.modalTitle}
                    onChange={(e) =>
                      setSiteContent({
                        ...siteContent,
                        formConfig: { ...siteContent.formConfig, modalTitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quote Modal Subtitle</label>
                  <input
                    type="text"
                    value={siteContent.formConfig.modalSubtitle}
                    onChange={(e) =>
                      setSiteContent({
                        ...siteContent,
                        formConfig: { ...siteContent.formConfig, modalSubtitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Contact Information & Notification Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50/75 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Target WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={siteContent.whatsapp}
                    onChange={(e) => setSiteContent({ ...siteContent, whatsapp: e.target.value })}
                    placeholder="918830167863"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Include country code without +</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> Customer Care Phone
                  </label>
                  <input
                    type="text"
                    value={siteContent.phone}
                    onChange={(e) => setSiteContent({ ...siteContent, phone: e.target.value })}
                    placeholder="+91 88301 67863"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Displayed on website & call buttons</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-600" /> Lead Notification Email
                  </label>
                  <input
                    type="email"
                    value={siteContent.email}
                    onChange={(e) => setSiteContent({ ...siteContent, email: e.target.value })}
                    placeholder="info@apkeliteservices.in"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Where email quote drafts are directed</span>
                </div>
              </div>

              {/* Promotional Discount Banner */}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase">Top Announcement / Promotional Banner</span>
                  </div>
                  <label className="flex items-center cursor-pointer space-x-2">
                    <input
                      type="checkbox"
                      checked={siteContent.promoBanner.enabled}
                      onChange={(e) =>
                        setSiteContent({
                          ...siteContent,
                          promoBanner: { ...siteContent.promoBanner, enabled: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Display on Website</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      value={siteContent.promoBanner.text}
                      onChange={(e) =>
                        setSiteContent({
                          ...siteContent,
                          promoBanner: { ...siteContent.promoBanner, text: e.target.value },
                        })
                      }
                      placeholder="e.g. Festival Offer: Flat 15% OFF on Home Deep Cleaning!"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={siteContent.promoBanner.discountPercent}
                      onChange={(e) =>
                        setSiteContent({
                          ...siteContent,
                          promoBanner: { ...siteContent.promoBanner, discountPercent: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      placeholder="15"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Localities Dropdown Control */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  Active Localities in Form Dropdown ({siteContent.formConfig.localities.length})
                </h3>

                <div className="flex flex-wrap gap-2">
                  {siteContent.formConfig.localities.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-medium text-slate-800 transition"
                    >
                      {loc}
                      <button
                        type="button"
                        onClick={() => handleRemoveLocality(loc)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 max-w-sm pt-1">
                  <input
                    type="text"
                    value={newLocalityInput}
                    onChange={(e) => setNewLocalityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLocality()}
                    placeholder="Add locality (e.g. Ravet, Kalyani Nagar)..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddLocality}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Services Dropdown Control */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-purple-600" />
                  Active Services in Form Dropdown ({siteContent.formConfig.services.length})
                </h3>

                <div className="flex flex-wrap gap-2">
                  {siteContent.formConfig.services.map((srv) => (
                    <span
                      key={srv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-100 rounded-xl text-xs font-medium"
                    >
                      {srv}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(srv)}
                        className="text-purple-400 hover:text-rose-600"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 max-w-sm pt-1">
                  <input
                    type="text"
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                    placeholder="Add service (e.g. Balcony Cleaning)..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEBSITE CONTENT & PRICING */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Service Pricing & Website Content
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update Starting from pricing, service cards, and frequently asked questions in real time.
                  </p>
                </div>

                <button
                  onClick={handleSaveContent}
                  disabled={savingContent}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingContent ? 'Saving...' : 'Save Website Content'}</span>
                </button>
              </div>

              {/* Services Pricing Table */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Service Catalog & Display Prices</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {siteContent.services.map((service, idx) => (
                    <div key={service.slug} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{service.title}</span>
                        <span className="text-[11px] font-mono text-slate-400">/{service.slug}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Starting Price Tag</label>
                          <input
                            type="text"
                            value={service.startingPrice}
                            onChange={(e) => {
                              const updated = [...siteContent.services];
                              updated[idx].startingPrice = e.target.value;
                              setSiteContent({ ...siteContent, services: updated });
                            }}
                            placeholder="Starting from ₹2,799"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Display Title</label>
                          <input
                            type="text"
                            value={service.title}
                            onChange={(e) => {
                              const updated = [...siteContent.services];
                              updated[idx].title = e.target.value;
                              setSiteContent({ ...siteContent, services: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Short Description</label>
                        <textarea
                          rows={2}
                          value={service.shortDescription}
                          onChange={(e) => {
                            const updated = [...siteContent.services];
                            updated[idx].shortDescription = e.target.value;
                            setSiteContent({ ...siteContent, services: updated });
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-slate-700"
                        ></textarea>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    Frequently Asked Questions (FAQs)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSiteContent({
                        ...siteContent,
                        faqs: [
                          ...siteContent.faqs,
                          { question: 'New Question?', answer: 'Answer details here...' },
                        ],
                      });
                    }}
                    className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add FAQ
                  </button>
                </div>

                <div className="space-y-3">
                  {siteContent.faqs.map((faq, fIdx) => (
                    <div key={fIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...siteContent.faqs];
                            updated[fIdx].question = e.target.value;
                            setSiteContent({ ...siteContent, faqs: updated });
                          }}
                          placeholder="Question..."
                          className="flex-1 mr-2 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSiteContent({
                              ...siteContent,
                              faqs: siteContent.faqs.filter((_, i) => i !== fIdx),
                            });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...siteContent.faqs];
                          updated[fIdx].answer = e.target.value;
                          setSiteContent({ ...siteContent, faqs: updated });
                        }}
                        placeholder="Answer details..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-slate-700"
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* View / Manage Lead Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
                  {activeLead.name[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{activeLead.name}</h3>
                  <span className="text-xs text-slate-500">Source: {activeLead.source}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteLead(activeLead._id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                  title="Delete Lead"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveLead(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Phone</span>
                  <a href={`tel:${activeLead.phone}`} className="font-semibold text-brand-600 text-sm hover:underline">
                    {activeLead.phone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Service</span>
                  <span className="font-semibold text-slate-800 text-sm">{activeLead.service}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Locality</span>
                  <span className="font-semibold text-slate-800 text-sm">{activeLead.locality || 'Pune'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Property Size</span>
                  <span className="font-semibold text-slate-800 text-sm">{activeLead.propertyType || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email</span>
                  <span className="font-semibold text-slate-800 text-sm truncate block">
                    {activeLead.email || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <select
                    value={activeLead.status}
                    onChange={(e) => handleUpdateStatus(activeLead._id, e.target.value as LeadItem['status'])}
                    className="mt-0.5 px-2 py-0.5 text-xs font-semibold rounded-lg border bg-white text-slate-800"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUOTE_SENT">Quote Sent</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </div>

              {activeLead.message && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Customer Note / Message</p>
                  <p className="text-sm text-slate-700 italic">&ldquo;{activeLead.message}&rdquo;</p>
                </div>
              )}

              <div className="flex gap-3">
                <a
                  href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Client
                </a>
                <a
                  href={`tel:${activeLead.phone}`}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Phone className="w-4 h-4" /> Call Client
                </a>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Follow-up & Staff Notes
                </h4>

                <div className="space-y-2.5 max-h-48 overflow-y-auto mb-4">
                  {activeLead.notes && activeLead.notes.length > 0 ? (
                    activeLead.notes.map((n, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span className="font-semibold text-slate-600">{n.author || 'Staff'}</span>
                          <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-slate-800">{n.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes added yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add follow-up notes (e.g. called, agreed to visit Saturday 10am)..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNote.trim()}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record New Lead / Phone Inquiry</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="rahul@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Service</label>
                  <select
                    value={newLeadForm.service}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, service: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  >
                    {siteContent.formConfig.services.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Locality</label>
                  <select
                    value={newLeadForm.locality}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, locality: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  >
                    {siteContent.formConfig.localities.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Property Type</label>
                <input
                  type="text"
                  value={newLeadForm.propertyType}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, propertyType: e.target.value })}
                  placeholder="e.g. 2 BHK, 3 BHK Villa, Office 1500 sq ft"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Inquiry / Note</label>
                <textarea
                  rows={2}
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  placeholder="Customer requirements, preferred timing, etc."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNewLead}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition"
                >
                  {submittingNewLead ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
