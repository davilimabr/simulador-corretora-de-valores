import moment from 'moment';

export function advanceClock(currentHHMM, incremento) {
  const date = moment(`2000-01-01 ${currentHHMM}`, 'YYYY-MM-DD HH:mm');
  const newDate = date.add(incremento, 'minutes');
  return newDate.format('HH:mm');
}
