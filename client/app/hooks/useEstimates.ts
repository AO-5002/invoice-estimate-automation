import useSWR from "swr";

export interface EstimateRecord {
  estimateNumber: string;
  estimateDate: string;
  client: string;
  property: string;
  projectDescription: string;
  costToClient: string;
  approved: string;
  administrativeNotes: string;
}

// TODO: point at the Google Sheets estimates read endpoint once backend exists
const ESTIMATES_ENDPOINT = "/api/estimates";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useEstimates() {
  const { data, error, isLoading } = useSWR<EstimateRecord[]>(
    ESTIMATES_ENDPOINT,
    fetcher,
  );

  return {
    estimates: data ?? [],
    isLoading,
    isError: !!error,
  };
}
