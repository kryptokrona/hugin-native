import moment from 'moment';

import { globals } from '@/config';

export const prettyPrintDateFromLocale = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(globals.language);
};

export const prettyPrintDate = (date?: moment.Moment) => {
  const currentDate = date || moment();
  if (moment().year() === currentDate.year()) {
    return currentDate.format('D MMM, HH:mm');
  }
  return currentDate.format('D MMM, YYYY HH:mm');
};
