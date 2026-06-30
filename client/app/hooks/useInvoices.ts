import useSWR from "swr";
import { fetcher } from "../lib/fetcher";

export interface InvoiceRecord {
  // Stable primary key (column A), server-generated on append. Used to target updates.
  id: string;
  invoiceDate: string;
  dateWorkCompleted: string;
  paymentDue: string;
  paymentStatus: string;
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
  serviceCategories: string[];
}

const EMPTY: InvoiceRecord[] = [];

export function useInvoices() {
  const { data, isLoading, error } = useSWR<InvoiceRecord[]>(
    "/api/invoices",
    fetcher,
  );

  return {
    // Stable reference while loading so consumers' effects don't loop.
    invoices: data ?? EMPTY,
    isLoading,
    isError: Boolean(error),
  };
}
