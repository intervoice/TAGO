
export enum PNRStatus {
  PD_PNR_CREATED = 'PD PNR Created',
  PD_PROP_SENT = 'PD Prop Sent',
  PD_UNCONFIRMED = 'PD Unconfirmed',
  PD_OFFER_SENT = 'PD Offer sent',
  XX_DECLINED = 'XX Declined',
  XX_CANCELLED_HDQ = 'XX Cancelled HDQ',
  XX_CANCELLED_AG = 'XX Canceled by AG',
  XX_CANCELLED_AIRLINE = 'XX Canceled by airline',
  OK_CONFIRMED = 'OK Confirmed',
  OK_CONTRACT_SENT = 'OK Contract Sent',
  OK_CONTRACT_SIGNED = 'OK Contract Signed',
  OK_COMM_REMINDER = 'OK Sent first comm reminder',
  OK_COMMITTED = 'OK Committed',
  XX_CANCELLED_AFTER_CONTRACT = 'XX Cancelled After Contract',
  DEPO_REMINDER_SENT = 'Depo Reminder Sent',
  DEPO_INVOICE_SENT = 'Depo Invoice Sent',
  OK_DEPOSIT_PAID = 'OK Deposit Paid',
  FULL_PAY_REMINDER_SENT = 'Full Pay Reminder Sent',
  FULL_PAY_INVOICE_SENT = 'Full Pay Invoice Sent',
  TICKETING_INSTRUCTIONS = 'Ticketing Instructions',
  FULL_PAY_EMD = 'Full Pay BY EMD',
  OK_ISSUED = 'OK Issued',
  DEPO_REFUND_RQST = 'Depo Refund Rqst',
  DEPO_REFUND_APPV = 'Depo Refund Appv',
  REFUND_INVOL = 'Refund SC/INVOL'
}

export type AirlineCode = string;

export enum UserRole {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  fullName: string;
  allowedAirlines?: AirlineCode[];
}

export interface CustomReminder {
  id: string;
  label: string;
  daysBefore: number;
  time?: string; // 'HH:MM' format, e.g. "10:00"
  active: boolean;
}

export type Currency = 'USD' | 'EUR' | 'ILS' | 'GBP';

export interface EmailSettings {
  gmailAddress: string;
  appPassword: string;
  senderName: string;
}

export interface AirlineConfig {
  airlineCode: AirlineCode;
  recipientEmail: string;
  currency: Currency;
  reminders: CustomReminder[];
}

export interface FlightGroup {
  id: string;
  airline: AirlineCode;
  dateCreated: string;
  pnr: string;
  agencyName: string;
  agentName: string;
  depDate: string;
  retDate?: string;
  routing: string;
  size: number;
  originalSize?: number; // Track initial size
  status: PNRStatus;
  dateOfferSent?: string;
  // New tracking fields
  recordByAgent?: string;
  dateSentToAirline?: string;
  
  // Specific alerts
  depositDate?: string;
  depositDaysBefore?: number;
  fullPaymentDate?: string;
  fullPaymentDaysBefore?: number;
  namesDate?: string;
  namesDaysBefore?: number;

  remarks: string;
  openingFeeReceipt: string;
  depoNumber: string;
  fPaymentEmd: string;
  fare: number;
  taxes: number;
  markup: number;
  flownPassengers: number;
  totalPaidToEtPerTicket: number;
}

export interface Reminder {
  type: string;
  dueDate: string;
  pnr: string;
  agency: string;
  description: string;
  isOverdue: boolean;
  emailTemplate: string;
}

export enum LogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export interface UserLog {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  username: string;
  action: LogAction;
  entityId: string;
  entityPNR: string;
  details: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
