import React from 'react';
import { 
  Navigation, 
  ShieldCheck, 
  Activity, 
  Users, 
  AlertOctagon,
  Building2
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { useTrip } from '../../context/TripContext';

export default function BottomNav() {
  const { activeTab, setActiveTab, setIsHazardModalOpen } = useSafety();
  const { isEscortActive } = useTrip();

  return (
    <nav className="tactical-dock">
      <button 
        className={`dock-item ${activeTab === 'routes' ? 'active' : ''}`}
        onClick={() => setActiveTab('routes')}
      >
        <Navigation size={18} />
        <span>PLANNER</span>
      </button>

      <button 
        className={`dock-item ${activeTab === 'escort' ? 'active' : ''}`}
        onClick={() => setActiveTab('escort')}
      >
        <ShieldCheck size={18} className={isEscortActive ? 'animate-beacon-live' : ''} />
        <span>LIVE ESCORT</span>
      </button>

      <button 
        className={`dock-item ${activeTab === 'audio' ? 'active' : ''}`}
        onClick={() => setActiveTab('audio')}
      >
        <Activity size={18} />
        <span>THREAT RADAR</span>
      </button>

      <button 
        className={`dock-item ${activeTab === 'tracker' ? 'active' : ''}`}
        onClick={() => setActiveTab('tracker')}
      >
        <Users size={18} />
        <span>CONTACT TRACKER</span>
      </button>

      <button 
        className="dock-item"
        style={{ color: 'var(--neon-amber)' }}
        onClick={() => setIsHazardModalOpen(true)}
      >
        <AlertOctagon size={18} />
        <span>REPORT HAZARD</span>
      </button>
    </nav>
  );
}
