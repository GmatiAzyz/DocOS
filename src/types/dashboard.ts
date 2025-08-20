export interface DashboardStats {
  totalPatients: number;
  appointmentsThisWeek: number;
  pendingInvoices: number;
}

export interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  time: string;
}

export interface Doctor {
  id: string;
  email: string;
  clinicName: string;
  specialty?: string;
  phone?: string;
  address?: string;
  trialEndsAt?: Date;
  subscriptionStatus?: string;
}

export interface Patient {
  id: string;
  doctorId: string;
  firstName: string;
  lastName: string;
  dob: Date;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
}

export interface VisitNote {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  visitDate: Date;
}

export interface Invoice {
  id: string;
  doctorId: string;
  patientId: string;
  invoiceNumber: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  dueDate: Date;
  items: any; // JSON field
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  notes?: string;
}
