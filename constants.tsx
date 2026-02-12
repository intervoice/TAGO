
import { PNRStatus, Currency } from './types';

export const STATUS_LIST = Object.values(PNRStatus);
export const DEFAULT_AIRLINES: string[] = ['ET', 'UX', 'BT', 'A2', 'GQ', 'HM', 'PG'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  ILS: '₪',
  GBP: '£'
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

export const getEmailTemplate = (type: string, data: any) => {
  switch (type) {
    case 'OFFER_FOLLOWUP':
      return `Dear Team,\n\nPlease check agent reply or cancel PNR. Group: ${data.pnr}`;
    default:
      return '';
  }
};
