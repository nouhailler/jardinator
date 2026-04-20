import { useEffect } from 'react';
import useStore from './store/useStore';
import Header from './components/Header';
import CardGrid from './components/CardGrid';
import CalendarView from './components/CalendarView';
import DetailModal from './components/DetailModal';
import MeteoWidget from './components/MeteoWidget';
import GardenPlanner from './components/GardenPlanner';
import OllamaChat from './components/OllamaChat';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const { init, activeTab, meteoOpen } = useStore();

  useEffect(() => { init(); }, []);

  const renderMain = () => {
    if (activeTab === 'calendar')  return <CalendarView />;
    if (activeTab === 'potager')   return <GardenPlanner />;
    if (activeTab === 'chat')      return <OllamaChat />;
    if (activeTab === 'settings')  return <SettingsPanel />;
    return <CardGrid />;
  };

  return (
    <div className="app">
      <Header />
      <main className="main">
        {renderMain()}
      </main>
      {meteoOpen && (
        <div className="meteo-panel">
          <MeteoWidget />
        </div>
      )}
      <DetailModal />
    </div>
  );
}
