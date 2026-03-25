import { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Loader as LoaderIcon } from 'lucide-react';
import { availabilityService } from '../services/availabilityService';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface Props {
  propertyId: string;
  ownerId: string;
}

const DAYS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mer' },
  { id: 4, label: 'Jeu' },
  { id: 5, label: 'Ven' },
  { id: 6, label: 'Sam' },
  { id: 0, label: 'Dim' },
];

const DEFAULT_RANGE = "09:00-18:00";

export default function AvailabilityManager({ propertyId, ownerId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<Record<number, string[]>>({});

  useEffect(() => {
    loadData();
  }, [propertyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await availabilityService.getAvailability(propertyId);
      if (data) {
        setSchedule(data.weekly_schedule);
      } else {
        // Init par défaut: Lun-Ven 09:00-18:00
        setSchedule({
          1: [DEFAULT_RANGE],
          2: [DEFAULT_RANGE],
          3: [DEFAULT_RANGE],
          4: [DEFAULT_RANGE],
          5: [DEFAULT_RANGE],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setSchedule(prev => {
      const isEnabled = !!prev[day];
      const newSchedule = { ...prev };
      if (isEnabled) {
        delete newSchedule[day];
      } else {
        newSchedule[day] = [DEFAULT_RANGE];
      }
      return newSchedule;
    });
  };

  const handleTimeChange = (day: number, rangeIndex: number, newValue: string) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[day][rangeIndex] = newValue;
      return newSchedule;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await availabilityService.setAvailability({
        property_id: propertyId,
        owner_id: ownerId,
        weekly_schedule: schedule,
        blocked_dates: [] // pas encore supporté en UI simple
      });
      alert('Disponibilités mises à jour.');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <LoaderIcon className="w-6 h-6 animate-spin" style={{ color: HColors.gold }} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: HColors.night, border: `1px solid ${HAlpha.gold15}` }}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold text-lg" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
          Disponibilités de visites
        </h3>
      </div>
      <p className="text-sm mb-5" style={{ color: 'rgba(245,230,200,0.7)', fontFamily: 'var(--font-nunito)' }}>
        Cochez les jours où vous ou votre agent pouvez faire visiter ce bien, et définissez la plage horaire.
      </p>

      <div className="space-y-3">
        {DAYS.map(day => {
          const isEnabled = !!schedule[day.id];
          const range = isEnabled ? schedule[day.id][0] : '';
          const [start = '09:00', end = '18:00'] = range.split('-');

          return (
            <div key={day.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl transition-all"
              style={{
                background: isEnabled ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isEnabled ? HAlpha.gold25 : 'rgba(255,255,255,0.05)'}`
              }}>
              <label className="flex items-center gap-2 cursor-pointer w-24">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleDay(day.id)}
                  className="rounded text-orange-500 bg-black/20 focus:ring-0 focus:ring-offset-0 border-white/10"
                />
                <span className="text-sm font-semibold" style={{ color: isEnabled ? HColors.gold : 'rgba(245,230,200,0.5)' }}>
                  {day.label}
                </span>
              </label>

              {isEnabled && (
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <input
                    type="time"
                    value={start}
                    onChange={(e) => handleTimeChange(day.id, 0, `${e.target.value}-${end}`)}
                    className="px-2 py-1.5 rounded-lg text-sm bg-black/30 border border-white/10 text-white outline-none"
                  />
                  <span className="text-sm text-gray-500">à</span>
                  <input
                    type="time"
                    value={end}
                    onChange={(e) => handleTimeChange(day.id, 0, `${start}-${e.target.value}`)}
                    className="px-2 py-1.5 rounded-lg text-sm bg-black/30 border border-white/10 text-white outline-none"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
          {saving ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
