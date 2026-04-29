import { useEffect, useState } from 'react';
import useStore from './store/useStore';
import Header from './components/Header';
import CardGrid from './components/CardGrid';
import CalendarView from './components/CalendarView';
import DetailModal from './components/DetailModal';
import MeteoWidget from './components/MeteoWidget';
import GardenPlanner from './components/GardenPlanner';
import OllamaChat from './components/OllamaChat';
import SettingsPanel from './components/SettingsPanel';
import HelpPanel from './components/HelpPanel';
import NewPlantModal from './components/NewPlantModal';
import DiagnosticPanel from './components/DiagnosticPanel';
import IdentificationPanel from './components/IdentificationPanel';
import YieldPanel from './components/YieldPanel';
import InputsPanel from './components/InputsPanel';
import IcsExportModal from './components/IcsExportModal';

export default function App() {
  const { init, activeTab, meteoOpen, newPlantOpen } = useStore();
  const [helpOpen, setHelpOpen]   = useState(false);
  const [icsOpen, setIcsOpen]     = useState(false);

  useEffect(() => { init(); }, []);

  const renderMain = () => {
    if (activeTab === 'calendar')  return <CalendarView />;
    if (activeTab === 'potager')   return <GardenPlanner />;
    if (activeTab === 'chat')        return <OllamaChat />;
    if (activeTab === 'diagnostic')     return <DiagnosticPanel />;
    if (activeTab === 'identification') return <IdentificationPanel />;
    if (activeTab === 'yields')         return <YieldPanel />;
    if (activeTab === 'inputs')         return <InputsPanel />;
    if (activeTab === 'settings')   return <SettingsPanel />;
    return <CardGrid />;
  };

  return (
    <div className="app">
      <Header onIcsExport={() => setIcsOpen(true)} />
      <main className="main">
        {renderMain()}
      </main>
      {meteoOpen && (
        <div className="meteo-panel">
          <MeteoWidget />
        </div>
      )}
      <DetailModal />
      {newPlantOpen && <NewPlantModal />}
      {icsOpen && <IcsExportModal onClose={() => setIcsOpen(false)} />}
      <button className="btn-help-float" onClick={() => setHelpOpen(true)} title="Aide">?</button>
      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)} activeTab={activeTab} />
    </div>
  );
}
