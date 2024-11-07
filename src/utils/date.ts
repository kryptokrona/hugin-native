import moment from 'moment';

// export const prettyPrintDateFromLocale = (timestamp: number) => {
//   const { preferences } = usePreferencesStore.getState();
//   const date = new Date(timestamp * 1000);
//   return date.toLocaleString(preferences.language);
// };

const prettyPrintMomentDate = (date?: moment.Moment) => {
  const currentDate = date || moment();
  if (moment().year() === currentDate.year()) {
    return currentDate.format('D MMM, HH:mm');
  }
  return currentDate.format('D MMM, YYYY HH:mm');
};

export const prettyPrintDate = (date: number) => {
  const currentDate = moment(date);
  return prettyPrintMomentDate(currentDate);
};
