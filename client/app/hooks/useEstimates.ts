import useSWR from "swr";
import { fetcher } from "../lib/fetcher";

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

const EMPTY: EstimateRecord[] = [];

export function useEstimates() {
  const { data, isLoading, error } = useSWR<EstimateRecord[]>(
    "/api/estimates",
    fetcher,
  );

  return {
    // Stable reference while loading so consumers' effects don't loop.
    estimates: data ?? EMPTY,
    isLoading,
    isError: Boolean(error),
  };
}
