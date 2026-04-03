import { useState, lazy, Suspense } from 'react';
import { Shield, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminDashboard, AdminTab } from '../hooks/useAdminDashboard';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';

// Modular Components
import { AdminTabs } from './admin/AdminTabs';
import { OverviewSection, PropertiesSection } from './admin/OverviewSection';
import { UsersSection, ModerationSection } from './admin/AdminSections';
import { AdminNotairesTab } from './admin/AdminNotairesTab';
import { UserDetailModal, PropertyDetailModal } from './admin/AdminModals';

// Lazy-loaded tabs
const AdminReportsTab = lazy(() => import('./AdminReportsTab'));
const AdminSurveysTab = lazy(() => import('./AdminSurveysTab'));
const AdminVisitsTab = lazy(() => import('./AdminVisitsTab'));
const AdminUsersSearchTab = lazy(() => import('./AdminUsersSearchTab'));
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
  const validTabs: AdminTab[] = ['overview', 'users', 'properties', 'verification', 'notaires', 'reports', 'surveys', 'visits', 'user-search', 'security', 'admin-management', 'cgv', 'ads'];
  const activeTab: AdminTab = validTabs.includes(tabFromUrl as AdminTab) ? tabFromUrl as AdminTab : 'overview';

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  if (!profile || profile.role !== 'admin') {
    return <div className="p-20 text-center font-bold text-red-600">Accès non autorisé.</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>
      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg,${HColors.night},#1A0E00)`, borderBottom: `1px solid ${HAlpha.gold20}` }}>
        <KenteLine height={4} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 flex-wrap pb-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0"
                style={{ background: HAlpha.bord20, border: `1px solid ${HAlpha.bord35}` }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-cream font-cormorant text-xl sm:text-2xl">Panneau Administrateur</h1>
                <p className="text-[10px] sm:text-sm opacity-60 text-cream font-nunito">Bonjour, {firstName} — Gestion HOMECI</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-[9px] sm:text-xs font-nunito font-bold overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <span className="px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/30 whitespace-nowrap">{stats.total_users} users</span>
                <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/30 whitespace-nowrap">{stats.verified_properties} certs</span>
                {stats.pending_properties > 0 && <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-white animate-pulse border border-red-500/30 whitespace-nowrap">{stats.pending_properties} mod</span>}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold text-gold/60 bg-gold/5 border border-gold/10 whitespace-nowrap">
                <RotateCcw className="w-3.5 h-3.5" /> Temps réel actif
              </div>
            </div>
          </div>

          <AdminTabs 
            activeTab={activeTab} 
            setActiveTab={(t) => navigate(`/dashboard/${t}`)} 
            stats={stats} 
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 min-h-[60vh]">
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
            {activeTab === 'cgv' && <AdminCGVTab />}
            {activeTab === 'ads' && <AdminAdsTab />}
            {activeTab === 'security' && <AdminLoginHistory />}
            {activeTab === 'admin-management' && <AdminManagement />}
          </Suspense>
        )}
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
          <KenteLine height={3} />
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: toast.ok ? HColors.night : HColors.bordeaux }}>
            {toast.ok ? <CheckCircle className="w-4 h-4 text-gold" /> : <XCircle className="w-4 h-4 text-white" />}
            <span className="text-sm font-bold text-white font-nunito">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
