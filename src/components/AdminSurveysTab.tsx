import { useState, useEffect } from 'react';
import { Star, TrendingUp, MessageCircle, Users } from 'lucide-react';
import { surveyService } from '../services/surveyService';
import type { SurveyResponse } from '../services/surveyService';
import { HColors, HAlpha } from '../styles/homeci-tokens';

const TRIGGER_LABELS: Record<string, string> = {
  visit_accepted: 'Visite acceptée',
  visit_completed: 'Visite effectuée',
  property_rented: 'Bien loué',
  property_sold: 'Bien vendu',
};

const ROLE_LABELS: Record<string, string> = {
  locataire: 'Locataire',
  proprietaire: 'Propriétaire',
  notaire: 'Notaire',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className="w-3.5 h-3.5"
          fill={i <= rating ? '#D4A017' : 'none'}
          style={{ color: i <= rating ? '#D4A017' : HAlpha.gold25 }} />
      ))}
    </div>
  );
}

export default function AdminSurveysTab() {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    surveyService.getAllSurveys().then(s => { setSurveys(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filterRole ? surveys.filter(s => s.user_role === filterRole) : surveys;
  const avgRating = filtered.length > 0 ? filtered.reduce((sum, s) => sum + s.rating, 0) / filtered.length : 0;
  const distribution = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: filtered.filter(s => s.rating === r).length,
    pct: filtered.length > 0 ? (filtered.filter(s => s.rating === r).length / filtered.length) * 100 : 0,
  }));

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: HAlpha.gold20, borderTopColor: HColors.gold }} />
    </div>
  );

  return (
    <div>
      <h2 className="font-bold text-xl mb-1" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
        Enquêtes de satisfaction
      </h2>
      <p className="text-sm mb-6" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
        {surveys.length} réponse{surveys.length > 1 ? 's' : ''} collectée{surveys.length > 1 ? 's' : ''}
      </p>

      {surveys.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <MessageCircle className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
          <p className="font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>
            Aucune enquête reçue
          </p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl p-5 text-center"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <Star className="w-8 h-8 mx-auto mb-2" fill="#D4A017" style={{ color: '#D4A017' }} />
              <div className="text-3xl font-bold" style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)' }}>
                {avgRating.toFixed(1)}
              </div>
              <div className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>Note moyenne / 5</div>
            </div>
            <div className="rounded-2xl p-5 text-center"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: HColors.navy }} />
              <div className="text-3xl font-bold" style={{ color: HColors.navy, fontFamily: 'var(--font-cormorant)' }}>
                {filtered.length}
              </div>
              <div className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>Réponses totales</div>
            </div>
            <div className="rounded-2xl p-5 text-center"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: HColors.vertCI }} />
              <div className="text-3xl font-bold" style={{ color: HColors.vertCI, fontFamily: 'var(--font-cormorant)' }}>
                {filtered.filter(s => s.rating >= 4).length}
              </div>
              <div className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>Satisfaits (4-5★)</div>
            </div>
            <div className="rounded-2xl p-5 text-center"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: HColors.orangeCI }} />
              <div className="text-3xl font-bold" style={{ color: HColors.orangeCI, fontFamily: 'var(--font-cormorant)' }}>
                {filtered.filter(s => s.comment.trim()).length}
              </div>
              <div className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>Avec commentaire</div>
            </div>
          </div>

          {/* Distribution */}
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
            <h3 className="font-bold mb-4" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
              Distribution des notes
            </h3>
            <div className="space-y-2.5">
              {distribution.map(d => (
                <div key={d.rating} className="flex items-center gap-3">
                  <span className="text-sm font-bold w-6 text-right" style={{ color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>
                    {d.rating}★
                  </span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: HAlpha.gold08 }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${d.pct}%`, background: d.rating >= 4 ? HColors.vertCI : d.rating >= 3 ? HColors.gold : HColors.orangeCI }} />
                  </div>
                  <span className="text-xs w-16 text-right" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    {d.count} ({d.pct.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filtre par rôle */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[
              { val: '', label: 'Tous' },
              { val: 'locataire', label: 'Locataires' },
              { val: 'proprietaire', label: 'Propriétaires' },
            ].map(f => (
              <button key={f.val} onClick={() => setFilterRole(f.val)}
                className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                style={filterRole === f.val
                  ? { background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }
                  : { background: HColors.white, color: HColors.brown, border: `1px solid ${HAlpha.gold20}`, fontFamily: 'var(--font-nunito)' }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Commentaires récents */}
          <div className="space-y-3">
            {filtered.filter(s => s.comment.trim()).slice(0, 20).map(s => (
              <div key={s.id} className="rounded-xl p-4"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StarRating rating={s.rating} />
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: HAlpha.orange08, color: HColors.orangeCI, fontFamily: 'var(--font-nunito)' }}>
                      {ROLE_LABELS[s.user_role] || s.user_role}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: HAlpha.navy08, color: HColors.navy, fontFamily: 'var(--font-nunito)' }}>
                      {TRIGGER_LABELS[s.trigger] || s.trigger}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    {new Date(s.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-sm" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                  « {s.comment} »
                </p>
                {s.property_title && (
                  <p className="text-xs mt-1" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    Bien : {s.property_title}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
