import React from 'react';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import TacticalMap from './components/map/TacticalMap';
import RouteCard from './components/navigation/RouteCard';
import EscortHUD from './components/companion/EscortHUD';
import ThreatVisualizer from './components/audio/ThreatVisualizer';
import ContactViewer from './components/companion/ContactViewer';
import FakeCallModal from './components/discreet/FakeCallModal';
import CamouflageCalc from './components/discreet/CamouflageCalc';
import PanicBeacon from './components/discreet/PanicBeacon';
import HazardReportModal from './components/crowdsource/HazardReportModal';
import { useSafety } from './context/SafetyContext';
import { useTrip } from './context/TripContext';

function MainLayout() {
  const { activeTab } = useSafety();

  return (
    <div className="app-container">
      {/* 1. Tactical HUD Header Bar */}
      <Header />

      {/* 2. Main Tactical Stage with Leaflet Canvas Background */}
      <main className="main-stage">
        <TacticalMap />

        {/* Floating Left Drawer / Panel based on active tab */}
        <div className="floating-overlay-left">
          {activeTab === 'routes' && <RouteCard />}
          {activeTab === 'escort' && <EscortHUD />}
          {activeTab === 'audio' && <ThreatVisualizer />}
          {activeTab === 'tracker' && <ContactViewer />}
        </div>
      </main>

      {/* 3. Bottom Quick Navigation Dock */}
      <BottomNav />

      {/* 4. Fullscreen / Stealth Modals */}
      <FakeCallModal />
      <CamouflageCalc />
      <PanicBeacon />
      <HazardReportModal />
    </div>
  );
}

export default function App() {
  return <MainLayout />;
}
