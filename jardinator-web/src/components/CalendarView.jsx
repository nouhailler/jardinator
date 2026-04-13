import useStore from '../store/useStore';
import { getByMonth, MONTH_LABELS, ACTIVITY_COLORS } from '../services/vegetableService';

const FULL_MONTHS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function PlantButton({ plant, openDetail }) {
  return (
    <button className="cal-plant-btn" onClick={() => openDetail(plant)}>
      {plant.name}
    </button>
  );
}

function ActivitySection({ actKey, plants, openDetail }) {
  if (!plants || plants.length === 0) return null;
  const colors = ACTIVITY_COLORS[actKey];
  return (
    <div className="cal-section" style={{ borderColor: colors.border, background: colors.bg }}>
      <div className="cal-section-title" style={{ color: colors.dot }}>{colors.label}</div>
      <div className="cal-plants">
        {plants.map(p => (
          <PlantButton key={p.id} plant={p} openDetail={openDetail} />
        ))}
      </div>
    </div>
  );
}

export default function CalendarView() {
  const month = useStore(s => s.calendarMonth);
  const setMonth = useStore(s => s.setCalendarMonth);
  const openDetail = useStore(s => s.openDetail);

  const data = getByMonth(month);
  const totalCount = data.sowingIndoor.length + data.sowingOutdoor.length +
    data.planting.length + data.harvest.length;

  const prevMonth = () => setMonth(month === 1 ? 12 : month - 1);
  const nextMonth = () => setMonth(month === 12 ? 1 : month + 1);
  const today = () => setMonth(new Date().getMonth() + 1);

  return (
    <div className="calendar-view">
      <div className="calendar-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>◀</button>
        <h2 className="cal-month-title">{FULL_MONTHS[month]}</h2>
        <button className="cal-nav-btn" onClick={nextMonth}>▶</button>
        <button className="cal-today-btn" onClick={today}>Aujourd'hui</button>
      </div>

      <div className="cal-summary">
        {totalCount} activité{totalCount !== 1 ? 's' : ''} ce mois ·{' '}
        {data.planting.length} plantation{data.planting.length !== 1 ? 's' : ''} ·{' '}
        {data.harvest.length} récolte{data.harvest.length !== 1 ? 's' : ''}
      </div>

      <div className="cal-sections">
        <ActivitySection actKey="sowingIndoor" plants={data.sowingIndoor} openDetail={openDetail} />
        <ActivitySection actKey="sowingOutdoor" plants={data.sowingOutdoor} openDetail={openDetail} />
        <ActivitySection actKey="planting" plants={data.planting} openDetail={openDetail} />
        <ActivitySection actKey="harvest" plants={data.harvest} openDetail={openDetail} />
      </div>

      {totalCount === 0 && (
        <div className="empty-state">
          <div className="empty-icon">😴</div>
          <div>Pas d'activités ce mois-ci.</div>
        </div>
      )}
    </div>
  );
}
