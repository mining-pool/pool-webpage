import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export const usePool = (admin = false) =>
  useQuery({
    queryKey: ["pool", admin],
    queryFn: ({ signal }) => api.pool(admin, signal),
    refetchInterval: 30000,
  });
export const useMetadata = (admin = false) =>
  useQuery({
    queryKey: ["metadata", admin],
    queryFn: ({ signal }) => api.metadata(admin, signal),
    staleTime: 300000,
  });
export const usePayments = (admin = false) =>
  useQuery({
    queryKey: ["payments", admin],
    queryFn: ({ signal }) => api.payments(admin, signal),
    refetchInterval: 60000,
  });
