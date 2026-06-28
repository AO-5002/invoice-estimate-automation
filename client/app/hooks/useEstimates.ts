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

// TODO: real Sheets endpoint
import { DUMMY_ESTIMATES } from "../data/dummy-data";

export function useEstimates() {
  return {
    estimates: DUMMY_ESTIMATES,
    isLoading: false,
    isError: false,
  };
}
