import useSWR from "swr";

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

// TODO: point at the Google Sheets read endpoint once the backend exists
const INVOICES_ENDPOINT = "/api/invoices";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useInvoices() {
  const { data, error, isLoading } = useSWR<InvoiceRecord[]>(
    INVOICES_ENDPOINT,
    fetcher,
  );

  return {
    invoices: data ?? [],
    isLoading,
    isError: !!error,
  };
}
