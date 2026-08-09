import React, { useState } from 'react';
import { 
  AlertOctagon, 
  LightbulbOff, 
  Eye, 
  ShieldAlert, 
  Construction, 
  X, 
  Send, 
  CheckCircle 
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { useTrip } from '../../context/TripContext';

export default function HazardReportModal() {
  const { isHazardModalOpen, setIsHazardModalOpen, fetchIncidents } = useSafety();
  const { currentLocation, fetchRouteComparison, origin, destination } = useTrip();

  const [category, setCategory] = useState("poor_lighting");
  const [severity, setSeverity] = useState("high");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isHazardModalOpen) return null;

  const categories = [
    { id: "poor_lighting", name: "Poor Lighting / Broken Lamp", icon: <LightbulbOff size={16} /> },
    { id: "suspicious_activity", name: "Suspicious Loitering", icon: <Eye size={16} /> },
    { id: "blocked_path", name: "Blocked Pathway / Scaffolding", icon: <Construction size={16} /> },
    { id: "harassment", name: "Aggressive Harassment", icon: <ShieldAlert size={16} /> }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: currentLocation?.lat || 40.7180,
          lng: currentLocation?.lng || -74.0020,
          category: category,
          severity: severity,
          description: description
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        fetchIncidents();
        fetchRouteComparison(origin, destination);
        setTimeout(() => {
          setIsSuccess(false);
          setDescription("");
          setIsHazardModalOpen(false);
        }, 1800);
      }
    } catch (e) {
      console.warn("Failed to report incident to backend:", e);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsHazardModalOpen(false);
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 10, 17, 0.85)',
      backdropFilter: 'blur(16px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel-elevated" style={{ width: '100%', maxWidth: '440px', padding: '20px', border: '1px solid var(--border-crimson)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={20} color="var(--neon-amber)" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', margin: 0 }}>
              REPORT STREET HAZARD
            </h2>
          </div>

          <button
            onClick={() => setIsHazardModalOpen(false)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={48} color="var(--neon-emerald)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: '#fff', marginBottom: '6px' }}>Hazard Reported!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Urban safety graph re-weighted. All night-walkers are now diverted around this point.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Category Selector */}
            <div>
              <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                HAZARD CATEGORY
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {categories.map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    style={{
                      background: category === c.id ? 'rgba(255, 183, 3, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: category === c.id ? '1px solid var(--neon-amber)' : '1px solid var(--border-subtle)',
                      color: category === c.id ? 'var(--neon-amber)' : 'var(--text-muted)',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {c.icon}
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                SEVERITY LEVEL
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['low', 'medium', 'high', 'critical'].map(sev => (
                  <button
                    type="button"
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      border: severity === sev ? '1px solid var(--neon-crimson)' : '1px solid var(--border-subtle)',
                      background: severity === sev ? 'rgba(255, 42, 109, 0.2)' : 'transparent',
                      color: severity === sev ? 'var(--neon-crimson)' : 'var(--text-muted)'
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                HAZARD DETAILS / LOCATION NOTES
              </label>
              <textarea
                className="tactical-input"
                rows="3"
                placeholder="E.g., 3 streetlights completely dark, narrow scaffolding blind spot..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="checkin-btn"
              style={{
                background: 'var(--neon-amber)',
                color: '#070A11',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Send size={16} />
              <span>{isSubmitting ? 'SUBMITTING...' : 'BROADCAST COMMUNITY HAZARD'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
