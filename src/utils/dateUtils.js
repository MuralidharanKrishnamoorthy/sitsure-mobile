export function getTodayInKolkata() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export function isUpcomingOrToday(dateString) {
  const today = getTodayInKolkata();
  return dateString >= today;
}

export function isThursdayOrFriday(dateString) {
  const d = new Date(dateString + 'T00:00:00');
  return d.getDay() === 4 || d.getDay() === 5;
}

export function toYYYYMMDD(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
