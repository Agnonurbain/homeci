/**
 * AdminAdsTab — Onglet de gestion des publicités (Admin Dashboard).
 * Deux sections : Biens Sponsorisés (Boosts) et Bannières Partenaires.
 */
import { useState, useEffect } from 'react';
import {
  Zap, Image, Plus, Pause, Play, Eye, MousePointer,
  Calendar, DollarSign, MapPin, X, Loader as LoaderIcon
} from 'lucide-react';
import { adService } from '../services/adService';
import { propertyService } from '../services/propertyService';
import type { PropertyBoost, AdBanner as AdBannerType, BoostDuration } from '../types/ad';
import { BOOST_PRICES, BANNER_PRICES } from '../types/ad';
import type { Property } from '../types/property';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

type SubTab = 'boosts' | 'banners';

export default function AdminAdsTab() {
  const [subTab, setSubTab] = useState<SubTab>('boosts');
  const [boosts, setBoosts] = useState<PropertyBoost[]>([]);
  const [banners, setBanners] = useState<AdBannerType[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaires
  const [showBoostForm, setShowBoostForm] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  // Boost form
  const [boostPropertyId, setBoostPropertyId] = useState('');
  const [boostDuration, setBoostDuration] = useState<BoostDuration>(7);
  const [boostSubmitting, setBoostSubmitting] = useState(false);

  // Banner form
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [bannerAdvertiser, setBannerAdvertiser] = useState('');
  const [bannerTargetCity, setBannerTargetCity] = useState('');
  const [bannerTargetTx, setBannerTargetTx] = useState('');
  const [bannerTargetType, setBannerTargetType] = useState('');
  const [bannerDays] = useState(30);
  const [bannerSubmitting, setBannerSubmitting] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [b, bn, props] = await Promise.all([
        adService.getAllBoosts(),
        adService.getAllBanners(),
        propertyService.getProperties({ status: 'published' }),
      ]);
      setBoosts(b);
      setBanners(bn);
      setProperties(props);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateBoost = async () => {
    if (!boostPropertyId) return;
    setBoostSubmitting(true);
    try {
      const prop = properties.find(p => p.id === boostPropertyId);
      await adService.createBoost(
        boostPropertyId,
        prop?.title || 'Bien',
        prop?.owner_id || '',
        boostDuration,
      );
      setShowBoostForm(false);
      setBoostPropertyId('');
      await loadAll();
    } catch (e) { console.error(e); }
    finally { setBoostSubmitting(false); }
  };

  const handleCreateBanner = async () => {
    if (!bannerTitle || !bannerImageUrl) return;
    setBannerSubmitting(true);
    try {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + bannerDays);
      await adService.createBanner({
        title: bannerTitle,
        imageUrl: bannerImageUrl,
        linkUrl: bannerLinkUrl,
        advertiserName: bannerAdvertiser,
        status: 'active',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        amountPaid: BANNER_PRICES.monthly.price,
        targetCity: bannerTargetCity || undefined,
        targetTransactionType: bannerTargetTx || undefined,
        targetPropertyType: bannerTargetType || undefined,
      });
      setShowBannerForm(false);
      setBannerTitle(''); setBannerImageUrl(''); setBannerLinkUrl('');
      setBannerAdvertiser(''); setBannerTargetCity(''); setBannerTargetTx(''); setBannerTargetType('');
      await loadAll();
    } catch (e) { console.error(e); }
    finally { setBannerSubmitting(false); }
  };

  const handleToggleBanner = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'paused' : 'active';
    await adService.updateBannerStatus(id, newStatus as any);
    await loadAll();
  };

  const handleCancelBoost = async (id: string) => {
    await adService.updateBoostStatus(id, 'cancelled');
    await loadAll();
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: HColors.cream,
    fontFamily: 'var(--font-nunito)',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderIcon className="w-6 h-6 animate-spin" style={{ color: HColors.gold }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-bold mb-1"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
          Publicités
        </h1>
        <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          Gérez les biens sponsorisés et les bannières partenaires
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { id: 'boosts' as SubTab, icon: Zap, label: 'Biens Sponsorisés', count: boosts.filter(b => b.status === 'active').length },
          { id: 'banners' as SubTab, icon: Image, label: 'Bannières Partenaires', count: banners.filter(b => b.status === 'active').length },
        ]).map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={subTab === t.id
              ? { background: HColors.navyDark, color: HColors.cream, fontFamily: 'var(--font-nunito)' }
              : { background: HColors.white, color: HColors.brown, border: '1px solid rgba(212,160,23,0.2)', fontFamily: 'var(--font-nunito)' }}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: HAlpha.orange20, color: HColors.orangeDark }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════ BOOSTS ════════════════════ */}
      {subTab === 'boosts' && (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>Boosts Actifs</div>
                <div className="text-2xl font-bold" style={{ color: HColors.orangeDark, fontFamily: 'var(--font-cormorant)' }}>
                  {boosts.filter(b => b.status === 'active').length}
                </div>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>Revenus Générés (Est.)</div>
                <div className="text-2xl font-bold" style={{ color: HColors.vertDark, fontFamily: 'var(--font-cormorant)' }}>
                  {formatPrice(boosts.reduce((acc, b) => acc + (b.amountPaid || 0), 0))}
                </div>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>Durée Moyenne</div>
                <div className="text-2xl font-bold" style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)' }}>
                  {boosts.length ? Math.round(boosts.reduce((acc, b) => acc + b.duration, 0) / boosts.length) : 0} jours
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-5">
              <div className="text-sm font-semibold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                Historique des Boosts
              </div>
            <button onClick={() => setShowBoostForm(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
              <Plus className="w-4 h-4" /> Nouveau Boost
            </button>
          </div>

          {boosts.length === 0 ? (
            <div className="rounded-2xl p-14 text-center"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <Zap className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
              <p className="text-lg font-semibold mb-1"
                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucun boost</p>
              <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                Les biens sponsorisés apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {boosts.map(boost => {
                const isActive = boost.status === 'active';
                return (
                  <div key={boost.id} className="rounded-2xl p-4 flex items-center justify-between gap-4"
                    style={{
                      background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                      boxShadow: '0 2px 10px rgba(26,14,0,0.05)',
                      opacity: isActive ? 1 : 0.6,
                    }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4" style={{ color: isActive ? HColors.gold : HColors.brown }} />
                        <span className="text-sm font-bold truncate"
                          style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
                          {boost.propertyTitle}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold`}
                          style={{
                            background: isActive ? HAlpha.vertCI10 : HAlpha.gold08,
                            color: isActive ? HColors.vertDark : HColors.brownMid,
                            border: `1px solid ${isActive ? HAlpha.vertCI25 : HAlpha.gold15}`,
                            fontFamily: 'var(--font-nunito)',
                          }}>
                          {isActive ? 'Actif' : boost.status === 'expired' ? 'Expiré' : 'Annulé'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs"
                        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(boost.startDate)} → {formatDate(boost.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {formatPrice(boost.amountPaid)}
                        </span>
                        <span>{boost.duration}j</span>
                      </div>
                    </div>
                    {isActive && (
                      <button onClick={() => handleCancelBoost(boost.id!)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                        style={{ background: HAlpha.bord10, color: HColors.bordeaux, border: `1px solid ${HAlpha.bord25}`, fontFamily: 'var(--font-nunito)' }}>
                        Annuler
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Modal Créer Boost ── */}
          {showBoostForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              style={{ background: 'rgba(10,22,14,0.88)', backdropFilter: 'blur(8px)' }}>
              <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>
                <div className="px-6 pt-5 pb-3">
                  <KenteLine />
                  <div className="flex items-center justify-between mt-4 mb-4">
                    <h2 className="text-lg font-bold"
                      style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                      <Zap className="w-4 h-4 inline" /> Nouveau Boost
                    </h2>
                    <button onClick={() => setShowBoostForm(false)} className="p-1.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <X className="w-4 h-4" style={{ color: 'rgba(245,230,200,0.4)' }} />
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <label htmlFor="ads-boost-type" className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'rgba(245,230,200,0.6)', fontFamily: 'var(--font-nunito)' }}>
                      Bien à sponsoriser
                    </label>
                    <select id="ads-boost-type" value={boostPropertyId} onChange={e => setBoostPropertyId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#D4A017]/40"
                      style={inputStyle}>
                      <option value="">Sélectionner un bien...</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id} style={{ background: HColors.night }}>
                          {p.title} — {p.city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5"
                      style={{ color: 'rgba(245,230,200,0.6)', fontFamily: 'var(--font-nunito)' }}>
                      Durée du boost
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([7, 14, 30] as BoostDuration[]).map(d => (
                        <button key={d} onClick={() => setBoostDuration(d)}
                          className="py-3 rounded-xl text-center text-sm font-medium transition-all"
                          style={boostDuration === d
                            ? { background: HAlpha.gold20, border: `2px solid ${HColors.gold}`, color: HColors.cream, fontFamily: 'var(--font-nunito)' }
                            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,230,200,0.6)', fontFamily: 'var(--font-nunito)' }}>
                          <div className="font-bold">{BOOST_PRICES[d].label}</div>
                          <div className="text-xs mt-0.5" style={{ color: HColors.gold }}>{formatPrice(BOOST_PRICES[d].price)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleCreateBoost}
                    disabled={!boostPropertyId || boostSubmitting}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                    {boostSubmitting ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Activer le Boost — {formatPrice(BOOST_PRICES[boostDuration].price)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ BANNIÈRES ════════════════════ */}
      {subTab === 'banners' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>Vues Totales</div>
              <div className="text-2xl font-bold" style={{ color: HColors.navy, fontFamily: 'var(--font-cormorant)' }}>
                {banners.reduce((acc, b) => acc + (b.impressions || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-2xl" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>Clics Totaux</div>
              <div className="text-2xl font-bold" style={{ color: HColors.orangeDark, fontFamily: 'var(--font-cormorant)' }}>
                {banners.reduce((acc, b) => acc + (b.clicks || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-2xl" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>CTR Moyen</div>
              <div className="text-2xl font-bold" style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)' }}>
                {banners.length ? (
                  (banners.reduce((acc, b) => acc + (b.clicks || 0), 0) / 
                   Math.max(1, banners.reduce((acc, b) => acc + (b.impressions || 0), 0))) * 100
                ).toFixed(2) : '0.00'}%
              </div>
            </div>
            <div className="p-4 rounded-2xl" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>Revenus Bannières</div>
              <div className="text-2xl font-bold" style={{ color: HColors.vertDark, fontFamily: 'var(--font-cormorant)' }}>
                {formatPrice(banners.reduce((acc, b) => acc + (b.amountPaid || 0), 0))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-5">
            <div className="text-sm font-semibold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
              Gestion des Bannières
            </div>
            <button onClick={() => setShowBannerForm(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
              <Plus className="w-4 h-4" /> Nouvelle Bannière
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="rounded-2xl p-14 text-center"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <Image className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
              <p className="text-lg font-semibold mb-1"
                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucune bannière</p>
              <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                Créez votre première bannière publicitaire
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map(banner => {
                const isActive = banner.status === 'active';
                return (
                  <div key={banner.id} className="rounded-2xl p-4 flex items-start gap-4"
                    style={{
                      background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                      boxShadow: '0 2px 10px rgba(26,14,0,0.05)',
                      opacity: isActive ? 1 : 0.6,
                    }}>
                    {/* Preview */}
                    <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: HAlpha.gold08 }}>
                      {banner.imageUrl && (
                        <img src={banner.imageUrl} alt={banner.title}
                          className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold truncate"
                          style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
                          {banner.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold`}
                          style={{
                            background: isActive ? HAlpha.vertCI10 : banner.status === 'paused' ? HAlpha.gold08 : HAlpha.bord10,
                            color: isActive ? HColors.vertDark : banner.status === 'paused' ? HColors.brownMid : HColors.bordeaux,
                            fontFamily: 'var(--font-nunito)',
                          }}>
                          {isActive ? 'Active' : banner.status === 'paused' ? 'En pause' : 'Expirée'}
                        </span>
                      </div>
                      <p className="text-xs mb-1"
                        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                        {banner.advertiserName}
                      </p>
                      <div className="flex items-center gap-4 text-xs flex-wrap"
                        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(banner.startDate)} → {formatDate(banner.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {banner.impressions} vues
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="w-3 h-3" /> {banner.clicks} clics
                        </span>
                        <span className="px-2 py-0.5 rounded bg-navy/5 font-bold" style={{ color: HColors.navy }}>
                          CTR: {banner.impressions ? ((banner.clicks / banner.impressions) * 100).toFixed(2) : '0.00'}%
                        </span>
                        {banner.targetCity && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-500" /> {banner.targetCity}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleToggleBanner(banner.id!, banner.status)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        title={isActive ? 'Mettre en pause' : 'Activer'}
                        style={{ background: HAlpha.gold08, color: HColors.brownMid }}>
                        {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Modal Créer Bannière ── */}
          {showBannerForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              style={{ background: 'rgba(10,22,14,0.88)', backdropFilter: 'blur(8px)' }}>
              <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
                style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>
                <div className="px-6 pt-5 pb-3 shrink-0">
                  <KenteLine />
                  <div className="flex items-center justify-between mt-4 mb-4">
                    <h2 className="text-lg font-bold"
                      style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                      🖼️ Nouvelle Bannière Partenaire
                    </h2>
                    <button onClick={() => setShowBannerForm(false)} className="p-1.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <X className="w-4 h-4" style={{ color: 'rgba(245,230,200,0.4)' }} />
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-3 overflow-y-auto">
                  {[
                    { label: 'Titre de la publicité', value: bannerTitle, set: setBannerTitle, placeholder: 'Ex: Crédit immobilier CMB' },
                    { label: 'Nom de l\'annonceur', value: bannerAdvertiser, set: setBannerAdvertiser, placeholder: 'Ex: BICI Banque' },
                    { label: 'URL de l\'image',  value: bannerImageUrl, set: setBannerImageUrl, placeholder: 'https://...' },
                    { label: 'Lien de destination', value: bannerLinkUrl, set: setBannerLinkUrl, placeholder: 'https://...' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold mb-1"
                        style={{ color: 'rgba(245,230,200,0.6)', fontFamily: 'var(--font-nunito)' }}>{f.label}</label>
                      <input type="text" value={f.value} onChange={e => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#D4A017]/40"
                        style={inputStyle} />
                    </div>
                  ))}

                  {/* Ciblage */}
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: HAlpha.gold50, fontFamily: 'var(--font-nunito)' }}>
                      Ciblage (optionnel)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label htmlFor="ads-filter-ville" className="block text-xs mb-1" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>Ville</label>
                        <input id="ads-filter-ville" type="text" value={bannerTargetCity} onChange={e => setBannerTargetCity(e.target.value)}
                          placeholder="Abidjan"
                          className="w-full px-2 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#D4A017]/40"
                          style={inputStyle} />
                      </div>
                      <div>
                        <label htmlFor="ads-filter-transaction" className="block text-xs mb-1" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>Transaction</label>
                        <select id="ads-filter-transaction" value={bannerTargetTx} onChange={e => setBannerTargetTx(e.target.value)}
                          className="w-full px-2 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#D4A017]/40"
                          style={inputStyle}>
                          <option value="" style={{ background: HColors.night }}>Toutes</option>
                          <option value="location" style={{ background: HColors.night }}>Location</option>
                          <option value="vente" style={{ background: HColors.night }}>Vente</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="ads-filter-type" className="block text-xs mb-1" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>Type de bien</label>
                        <select id="ads-filter-type" value={bannerTargetType} onChange={e => setBannerTargetType(e.target.value)}
                          className="w-full px-2 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#D4A017]/40"
                          style={inputStyle}>
                          <option value="" style={{ background: HColors.night }}>Tous</option>
                          <option value="villa" style={{ background: HColors.night }}>Villa</option>
                          <option value="appartement" style={{ background: HColors.night }}>Appartement</option>
                          <option value="terrain" style={{ background: HColors.night }}>Terrain</option>
                          <option value="maison" style={{ background: HColors.night }}>Maison</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleCreateBanner}
                    disabled={!bannerTitle || !bannerImageUrl || bannerSubmitting}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                    {bannerSubmitting ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    Créer la Bannière — {formatPrice(BANNER_PRICES.monthly.price)}/mois
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
