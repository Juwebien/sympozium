import { useQuery } from "@tanstack/react-query";
import { opsclawApi } from "@/lib/opsclaw-api";

export function useOpsClawConsoleProfile() {
  return useQuery({
    queryKey: ["opsclaw", "platform-console-profile"],
    queryFn: opsclawApi.platformConsole.profile,
    staleTime: 60_000,
  });
}

export function useOpsClawConsoleReadModel() {
  return useQuery({
    queryKey: ["opsclaw", "platform-console-read-model"],
    queryFn: opsclawApi.platformConsole.readModel,
    staleTime: 60_000,
  });
}
