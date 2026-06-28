export interface InvoiceRecord {
  invoiceDate: string;
  dateWorkCompleted: string;
  paymentDue: string;
  estimateReference: string;
  invoiceNumber: string;
  client: string;
  property: string;
  projectDescription: string;
  costToClient: string;
  laborExpense: string;
  equipmentExpense: string;
  materialsExpense: string;
  administrativeNotes: string;
  completionStatus: string;
  serviceCategories: string[];
}

// TODO: real Sheets endpoint
import { DUMMY_INVOICES } from "../data/dummy-data";

export function useInvoices() {
  return {
    invoices: DUMMY_INVOICES,
    isLoading: false,
    isError: false,
  };
}
