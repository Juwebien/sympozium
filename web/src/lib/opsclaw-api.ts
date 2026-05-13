import {
  AUTH_UNAUTHORIZED_EVENT,
  ApiError,
  clearToken,
  getToken,
} from "@/lib/api";

export interface OpsClawApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
}

export interface OpsClawGuardrails {
  allowedActionModes?: string[];
  disallowedClaims?: string[];
}

export interface OpsClawConsoleView {
  id: string;
  displayName: string;
  sourceApi: string;
  state: string;
  scopes: string[];
}

export interface OpsClawConsoleAction {
  id: string;
  displayName: string;
  targetView: string;
  mode: string;
  state: string;
  method?: string;
  sourceApi: string;
  preflightApi?: string;
  requiredScopes: string[];
  authGate: string;
  auditEvent: string;
  rollbackPolicy: string;
  evidenceRefs: string[];
}

export interface OpsClawConsoleProfile {
  id: string;
  version: string;
  displayName: string;
  readiness: string;
  audience: string[];
  views: OpsClawConsoleView[];
  actions: OpsClawConsoleAction[];
  writePolicy: string;
  guardrails: OpsClawGuardrails;
}

export interface OpsClawConsoleReadModelView {
  id: string;
  displayName: string;
  sourceApi: string;
  projection: string;
  state: string;
  requiredScopes: string[];
}

export interface OpsClawConsoleReadModel {
  id: string;
  version: string;
  displayName: string;
  readiness: string;
  profileRef: string;
  views: OpsClawConsoleReadModelView[];
  blockedWrites: string[];
  guardrails: OpsClawGuardrails;
}

const DEFAULT_OPSCLAW_BASE = "/opsclaw-api";

export function getOpsClawApiBase(): string {
  const configured = import.meta.env.VITE_OPSCLAW_API_BASE as string | undefined;
  return (configured || DEFAULT_OPSCLAW_BASE).replace(/\/+$/, "");
}

function handleUnauthorized() {
  clearToken();
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}

function safeToken(token: string): string {
  return token.replace(/[^\x00-\xFF]/g, "");
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    ("success" in payload || "data" in payload)
  ) {
    const envelope = payload as OpsClawApiEnvelope<T>;
    if (envelope.success === false) {
      throw new Error(
        envelope.error?.message || envelope.message || "OpsClaw API request failed",
      );
    }
    if ("data" in envelope) return envelope.data as T;
  }
  return payload as T;
}

async function opsclawFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${safeToken(token)}`);

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getOpsClawApiBase()}${normalizedPath}`;
  const response = await fetch(url, { ...init, headers });

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError("Unauthorized", 401);
  }
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(text || `HTTP ${response.status}`, response.status);
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("text/html")) {
    throw new Error(
      "Unexpected HTML response from OpsClaw API. Check VITE_OPSCLAW_API_BASE or the /opsclaw-api dev proxy.",
    );
  }

  return unwrapEnvelope<T>(await response.json());
}

export const opsclawApi = {
  platformConsole: {
    profile: () =>
      opsclawFetch<OpsClawConsoleProfile>(
        "/v1/platform-console-profiles/opsclaw-platform-console@v1",
      ),
    readModel: () =>
      opsclawFetch<OpsClawConsoleReadModel>(
        "/v1/platform-console-read-models/opsclaw-platform-console-read-model@v1",
      ),
  },
};
