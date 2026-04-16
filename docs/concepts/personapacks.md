# PersonaPacks

PersonaPacks are the **recommended way to get started** with Sympozium. A PersonaPack is a CRD that bundles multiple pre-configured agent personas — each with a system prompt, skills, tool policy, schedule, and memory seeds. Activating a pack is a single action: the PersonaPack controller stamps out all the Kubernetes resources automatically.

## Why PersonaPacks?

Without PersonaPacks, setting up even one agent requires creating a Secret, SympoziumInstance, SympoziumSchedule, and memory ConfigMap by hand. PersonaPacks collapse that into: pick a pack → enter your API key → done.

## How It Works

```
PersonaPack "platform-team" (3 personas)
  │
  ├── Activate via TUI or Web UI (wizard → API key → confirm)
  │
  └── Controller stamps out:
      ├── Secret: platform-team-openai-key
      ├── SympoziumInstance: platform-team-security-guardian
      │   ├── SympoziumSchedule: ...security-guardian-schedule (every 30m)
      │   └── ConfigMap: ...security-guardian-memory (seeded)
      ├── SympoziumInstance: platform-team-sre-watchdog
      │   ├── SympoziumSchedule: ...sre-watchdog-schedule (every 5m)
      │   └── ConfigMap: ...sre-watchdog-memory (seeded)
      └── SympoziumInstance: platform-team-platform-engineer
          ├── SympoziumSchedule: ...platform-engineer-schedule (weekdays 9am)
          └── ConfigMap: ...platform-engineer-memory (seeded)
```

All generated resources have `ownerReferences` pointing back to the PersonaPack — delete the pack and everything gets garbage-collected.

## Persona Relationships & Workflows

PersonaPacks support **typed relationships** between personas, enabling coordination patterns beyond independent scheduling:

### Relationship Types

| Type | Behaviour | Example |
|------|-----------|---------|
| `delegation` | Source requests target, awaits result, then continues | Researcher delegates to Writer |
| `sequential` | Source must complete before target starts | Writer finishes → Reviewer begins |
| `supervision` | Source monitors target (observability only) | Lead supervises Writer and Reviewer |

### Workflow Types

The `workflowType` field on a PersonaPack describes the overall orchestration pattern:

| Value | Description |
|-------|-------------|
| `autonomous` | Default. Personas run independently on their own schedules. |
| `pipeline` | Personas execute in sequence defined by `sequential` edges. |
| `delegation` | Personas can actively delegate to each other at runtime. |

### Defining Relationships

```yaml
apiVersion: sympozium.ai/v1alpha1
kind: PersonaPack
metadata:
  name: research-team
spec:
  workflowType: delegation
  personas:
    - name: researcher
      systemPrompt: "You are a research analyst..."
    - name: writer
      systemPrompt: "You are a technical writer..."
    - name: reviewer
      systemPrompt: "You are a quality reviewer..."
  relationships:
    - source: researcher
      target: writer
      type: delegation
      timeout: "10m"
      resultFormat: markdown
    - source: writer
      target: reviewer
      type: sequential
      timeout: "5m"
```

### delegate_to_persona Tool

Agents that belong to a PersonaPack automatically receive the `delegate_to_persona` tool. This allows an agent to delegate a task to another persona in the same pack:

```
Tool: delegate_to_persona
Arguments:
  targetPersona: "writer"
  task: "Write a report based on these findings: ..."
```

The tool writes a spawn request to the IPC protocol. The spawner resolves the target persona to the correct SympoziumInstance, validates the relationship edge exists, and creates a child AgentRun.

### Visual Canvas

The Web UI provides two canvas views for visualising persona relationships:

- **Per-pack canvas** (Persona detail page → Workflow tab): editable — drag to connect personas, pick relationship type, save back to the CRD
- **Global canvas** (Persona Packs list page → Canvas view): read-only — shows all enabled packs together with live run status
- **Dashboard widget** (Team Canvas panel): compact view with pack selector dropdown and live run status highlighting

Persona nodes show live run status with animated indicators:

- **Running**: pulsing blue ring + task preview
- **Serving**: pulsing violet ring
- **AwaitingDelegate**: pulsing amber ring
- **Failed**: red ring
- **Succeeded**: green ring

## Built-in Packs

| Pack | Category | Agents | Description |
|------|----------|--------|-------------|
| `platform-team` | Platform | Security Guardian, SRE Watchdog, Platform Engineer | Core platform engineering — security audits, cluster health, manifest review |
| `devops-essentials` | DevOps | Incident Responder, Cost Analyzer | DevOps workflows — incident triage, resource right-sizing |
| `developer-team` | Development | Tech Lead, Backend Dev, Frontend Dev, QA Engineer, Code Reviewer, DevOps Engineer, Docs Writer | A 2-pizza software development team that collaborates on a single GitHub repository |
| `research-team` | Research | Lead, Researcher, Writer, Reviewer | A coordinated research and reporting team demonstrating delegation, sequential, and supervision relationships |
| `observability-mcp-team` | Observability | Grafana Analyst, Log Investigator | Observability workflows using MCP servers for Grafana and Loki |

## Activating a Pack in the Web UI

1. Navigate to **Persona Packs** in the sidebar
2. Click **Enable** on a pack to open the onboarding wizard
3. Choose your AI provider and paste an API key
4. Optionally bind channels (Telegram, Slack, Discord, WhatsApp)
5. Confirm — the controller creates all instances within seconds

## Activating via kubectl

```yaml
# 1. Create the provider secret
kubectl create secret generic my-pack-openai-key \
  --from-literal=OPENAI_API_KEY=sk-...

# 2. Patch the PersonaPack with authRefs to trigger activation
kubectl patch personapack platform-team --type=merge -p '{
  "spec": {
    "authRefs": [{"provider": "openai", "secret": "my-pack-openai-key"}]
  }
}'
```

The controller detects the `authRefs` change and reconciles — creating SympoziumInstances, Schedules, and memory ConfigMaps for each persona.

## Writing Your Own PersonaPack

```yaml
apiVersion: sympozium.ai/v1alpha1
kind: PersonaPack
metadata:
  name: my-team
spec:
  description: "My custom agent team"
  category: custom
  version: "1.0.0"
  workflowType: delegation
  personas:
    - name: planner
      displayName: "Planner"
      systemPrompt: |
        You plan work and delegate to the executor.
      skills:
        - k8s-ops
        - memory
      schedule:
        type: heartbeat
        interval: "1h"
        task: "Check for pending work and delegate to the executor."
    - name: executor
      displayName: "Executor"
      systemPrompt: |
        You execute tasks assigned by the planner.
      skills:
        - k8s-ops
        - memory
  relationships:
    - source: planner
      target: executor
      type: delegation
      timeout: "15m"
```

Apply it with `kubectl apply -f my-team.yaml`, then activate through the Web UI or TUI.

!!! tip
    See the [Developer Team Pack](../skills/developer-team.md) for a detailed example of a complex PersonaPack with seven collaborating agents.
