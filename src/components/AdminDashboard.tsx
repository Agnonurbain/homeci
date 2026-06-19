import { useState, lazy, Suspense } from 'react';
import { Bell, Settings, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminDashboard, AdminTab } from '../hooks/useAdminDashboard';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import RealTimeIndicator from './shared/RealTimeIndicator';

// Modular Components
import AdminSidebar from './admin/AdminSidebar';
import { OverviewSection, PropertiesSection } from './admin/OverviewSection';
import { UsersSection, ModerationSection } from './admin/AdminSections';
import { AdminNotairesTab } from './admin/AdminNotairesTab';
import { UserDetailModal, PropertyDetailModal } from './admin/AdminModals';
import AdminExportTab from './admin/AdminExportTab';
import AdminAnalyticsTab from './admin/AdminAnalyticsTab';

// Lazy-loaded tabs
const AdminReportsTab = lazy(() => import('./AdminReportsTab'));
const AdminSurveysTab = lazy(() => import('./AdminSurveysTab'));
const AdminVisitsTab = lazy(() => import('./AdminVisitsTab'));
const AdminUsersSearchTab = lazy(() => import('./AdminUsersSearchTab'));
const AdminAuditLogs = lazy(() => import('./admin/AdminAuditLogs'));
const AdminCGVTab = lazy(() => import('./AdminCGVTab'));
const AdminAdsTab = lazy(() => import('./AdminAdsTab'));
const AdminLoginHistory = lazy(() => import('./AdminLoginHistory'));
const AdminManagement = lazy(() => import('./AdminManagement'));

const Loader = () => (
  <div className="flex justify-center py-16">
    <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
      style={{ borderColor: HAlpha.gold20, borderTopColor: HColors.gold }} />
  </div>
);

export default function AdminDashboard() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Custom Hook
  const api = useAdminDashboard(profile);
  const { loading, stats, toast } = api;

  const tabFromUrl = location.pathname.split('/')[2];
  const validTabs: AdminTab[] = ['overview', 'users', 'properties', 'verification', 'notaires', 'reports', 'surveys', 'visits', 'user-search', 'security', 'admin-management', 'cgv', 'ads', 'exports', 'analytics', 'audit'];
  const activeTab: AdminTab = validTabs.includes(tabFromUrl as AdminTab) ? tabFromUrl as AdminTab : 'overview';

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  const TAB_LABELS: Record<string, string> = {
    overview: 'Vue d\'ensemble', users: 'Utilisateurs', notaires: 'Codes Notaires',
    'user-search': 'Recherche', properties: 'Biens', verification: 'Modération',
    reports: 'Signalements', visits: 'Visites', surveys: 'Satisfaction',
    cgv: 'Docs Légaux', ads: 'Publicités', security: 'Sécurité',
    'admin-management': 'Admins', audit: 'Journal d\'Audit', exports: 'Exports', analytics: 'Analytics',
  };

  if (!profile || profile.role !== 'admin') {
    return <div className="p-20 text-center font-bold text-[#8B1D1D]">Accès non autorisé.</div>;
  }

  return (
    <div className="flex min-h-screen" style={{ background: HColors.creamBg }}>
      {/* ── Sidebar ── */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={(t) => navigate(`/dashboard/${t}`)}
        stats={stats}
        adminName={firstName}
        adminEmail={profile?.email}
      />

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6"
          style={{
            height: 54,
            background: 'rgba(27,94,58,0.97)',
            backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${HAlpha.gold25}`,
          }}
        >
          <div className="flex items-center gap-3">
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem', fontWeight: 700, color: HColors.cream }}>
              {TAB_LABELS[activeTab] || activeTab}
            </h2>
            <RealTimeIndicator />
          </div>
          <div className="flex items-center gap-3">
            <div style={{ fontFamily: 'var(--font-nunito)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: HColors.cream }}>
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(245,230,200,0.50)', marginLeft: 8, textTransform: 'capitalize' as const }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <button
              className="relative w-[34px] h-[34px] rounded-[9px] flex items-center justify-center"
              style={{ background: HAlpha.gold10, border: `1px solid ${HAlpha.gold20}` }}
              onClick={() => navigate('/dashboard/reports')}
            >
              <Bell className="w-4 h-4" style={{ color: HColors.gold }} />
              {stats.pending_properties > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{ background: HColors.bordeaux, color: '#fff' }}>
                  {stats.pending_properties}
                </span>
              )}
            </button>
            <button
              className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center"
              style={{ background: HAlpha.gold10, border: `1px solid ${HAlpha.gold20}` }}
            >
              <Settings className="w-4 h-4" style={{ color: HColors.gold }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 min-h-[60vh]">
          {loading ? <Loader /> : (
            <Suspense fallback={<Loader />}>
              {activeTab === 'overview' && (
                <OverviewSection
                  stats={stats}
                  properties={api.properties}
                  onViewProperty={setSelectedProperty}
                />
              )}
              {activeTab === 'users' && (
                <UsersSection
                  users={api.filteredUsers}
                  filterRole={api.filterRole}
                  setFilterRole={api.setFilterRole}
                  filterDate={api.filterDate}
                  setFilterDate={api.setFilterDate}
                  onViewDetails={setSelectedUser}
                />
              )}
              {activeTab === 'properties' && (
                <PropertiesSection
                  properties={api.filteredProperties}
                  filterType={api.filterPropType}
                  setFilterType={api.setFilterPropType}
                  filterStatus={api.filterPropStatus}
                  setFilterStatus={api.setFilterPropStatus}
                  filterCity={api.filterPropCity}
                  setFilterCity={api.setFilterPropCity}
                  sort={api.sortProp}
                  setSort={api.setSortProp}
                  onViewDetails={setSelectedProperty}
                />
              )}
              {activeTab === 'verification' && (
                <ModerationSection
                  properties={api.filteredPendingProperties}
                  onViewDetails={setSelectedProperty}
                  onReject={api.rejectProperty}
                  onConsumeToken={async (token: string) => {
                    const res = await api.handleConsumeToken(token);
                    return !!res;
                  }}
                />
              )}
              {activeTab === 'notaires' && <AdminNotairesTab showToast={api.showToast} />}
              {activeTab === 'user-search' && <AdminUsersSearchTab showToast={api.showToast} />}
              {activeTab === 'reports' && <AdminReportsTab showToast={api.showToast} />}
              {activeTab === 'surveys' && <AdminSurveysTab />}
              {activeTab === 'visits' && <AdminVisitsTab />}
              {activeTab === 'cgv' && <AdminCGVTab users={api.users} />}
              {activeTab === 'ads' && <AdminAdsTab />}
              {activeTab === 'security' && <AdminLoginHistory />}
              {activeTab === 'admin-management' && <AdminManagement />}
              {activeTab === 'audit' && (
                <Suspense fallback={<div className="py-20 text-center" style={{ color: HColors.brown }}>Chargement des logs...</div>}>
                  <AdminAuditLogs />
                </Suspense>
              )}
              {activeTab === 'exports' && (
                <AdminExportTab
                  users={api.users}
                  showToast={api.showToast}
                />
              )}
              {activeTab === 'analytics' && <AdminAnalyticsTab />}
            </Suspense>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      <PropertyDetailModal
        property={selectedProperty}
        onReject={api.rejectProperty}
        onClose={() => setSelectedProperty(null)}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 overflow-hidden rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300" style={{ minWidth: 260 }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: toast.ok ? HColors.night : HColors.bordeaux }}>
            {toast.ok ? <CheckCircle className="w-4 h-4" style={{ color: HColors.gold }} /> : <XCircle className="w-4 h-4 text-white" />}
            <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-nunito)' }}>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
