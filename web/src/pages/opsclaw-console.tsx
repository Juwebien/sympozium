import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Network,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useOpsClawConsoleProfile,
  useOpsClawConsoleReadModel,
} from "@/hooks/use-opsclaw-api";
import {
  getOpsClawApiBase,
  type OpsClawConsoleAction,
  type OpsClawConsoleReadModelView,
} from "@/lib/opsclaw-api";
import { cn } from "@/lib/utils";

function badgeVariant(
  value: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (value.includes("blocked") || value.includes("forbidden")) {
    return "destructive";
  }
  if (value.includes("permissioned") || value.includes("available")) {
    return "default";
  }
  if (value.includes("read_only") || value.includes("contract")) {
    return "outline";
  }
  return "secondary";
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-base">OpsClaw API unavailable</CardTitle>
        </div>
        <CardDescription>
          The Sympozium shell is reachable, but the OpsClaw control-plane
          contract endpoint did not answer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="font-mono text-xs text-muted-foreground">
          base={getOpsClawApiBase()}
        </div>
        <p className="text-yellow-700 dark:text-yellow-300">{message}</p>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Network;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 font-semibold",
              typeof value === "number" ? "text-2xl" : "break-all text-base",
            )}
          >
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[0, 1, 2, 3].map((idx) => (
        <Card key={idx}>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReadModelTable({
  views,
}: {
  views: OpsClawConsoleReadModelView[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Read Model</CardTitle>
        <CardDescription>
          OpsClaw projections exposed inside the Sympozium console shell
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>View</TableHead>
              <TableHead>Source API</TableHead>
              <TableHead>Projection</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Scopes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.map((view) => (
              <TableRow key={view.id}>
                <TableCell className="font-medium">{view.displayName}</TableCell>
                <TableCell className="max-w-[220px] break-all font-mono text-xs text-muted-foreground">
                  {view.sourceApi}
                </TableCell>
                <TableCell className="max-w-[360px] break-words text-sm">
                  {view.projection.replace(/_/g, " ")}
                </TableCell>
                <TableCell>
                  <Badge variant={badgeVariant(view.state)}>{view.state}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {view.requiredScopes.map((scope) => (
                      <Badge key={scope} variant="secondary">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ActionTable({ actions }: { actions: OpsClawConsoleAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Action Manifest</CardTitle>
        <CardDescription>
          Permissioned writes stay governed by OpsClaw auth, audit, and rollback
          contracts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>API</TableHead>
              <TableHead>Gate</TableHead>
              <TableHead>Audit</TableHead>
              <TableHead>Rollback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => (
              <TableRow key={action.id}>
                <TableCell className="min-w-[12rem]">
                  <div className="font-medium">{action.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.targetView}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant={badgeVariant(action.mode)}>
                      {action.mode}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {action.state}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[260px] break-all font-mono text-xs text-muted-foreground">
                  {action.method && (
                    <span className="font-semibold text-foreground">
                      {action.method}{" "}
                    </span>
                  )}
                  {action.sourceApi}
                </TableCell>
                <TableCell className="max-w-[220px] break-words text-sm">
                  {action.authGate.replace(/_/g, " ")}
                </TableCell>
                <TableCell className="max-w-[190px] break-words font-mono text-xs">
                  {action.auditEvent}
                </TableCell>
                <TableCell className="max-w-[260px] break-words text-sm">
                  {action.rollbackPolicy.replace(/_/g, " ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function OpsClawConsolePage() {
  const profileQuery = useOpsClawConsoleProfile();
  const readModelQuery = useOpsClawConsoleReadModel();
  const profile = profileQuery.data;
  const readModel = readModelQuery.data;
  const loading = profileQuery.isLoading || readModelQuery.isLoading;
  const error = profileQuery.error || readModelQuery.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">OpsClaw Console</h1>
          <p className="text-sm text-muted-foreground">
            Product platform read model mounted in the Sympozium operations UI
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.readiness && (
            <Badge variant={badgeVariant(profile.readiness)}>
              {profile.readiness}
            </Badge>
          )}
          {readModel?.readiness && (
            <Badge variant={badgeVariant(readModel.readiness)}>
              {readModel.readiness}
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <ErrorState
          message={error instanceof Error ? error.message : String(error)}
        />
      )}

      {loading && <LoadingGrid />}

      {profile && readModel && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              icon={Network}
              label="Views"
              value={readModel.views.length}
              detail="read-only projections"
            />
            <MetricCard
              icon={LockKeyhole}
              label="Actions"
              value={profile.actions.length}
              detail="manifested writes"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Blocked Writes"
              value={readModel.blockedWrites.length}
              detail="declared by read model"
            />
            <MetricCard
              icon={FileText}
              label="Profile"
              value={`${profile.id}@${profile.version}`}
              detail="OpsClaw source contract"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">Ownership Boundary</CardTitle>
                </div>
                <CardDescription>
                  Sympozium renders the shell; OpsClaw owns product policy and
                  write authority.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Write policy
                  </p>
                  <p className="mt-1 break-words font-mono text-xs">
                    {profile.writePolicy}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Audience
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {profile.audience.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guardrails</CardTitle>
                <CardDescription>
                  Claims and action modes declared by the OpsClaw contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Allowed action modes
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(profile.guardrails.allowedActionModes || []).map((mode) => (
                      <Badge key={mode} variant={badgeVariant(mode)}>
                        {mode}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Disallowed claims
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(profile.guardrails.disallowedClaims || []).map((claim) => (
                      <Badge key={claim} variant="outline">
                        {claim}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <ReadModelTable views={readModel.views} />
          <ActionTable actions={profile.actions} />
        </>
      )}
    </div>
  );
}
