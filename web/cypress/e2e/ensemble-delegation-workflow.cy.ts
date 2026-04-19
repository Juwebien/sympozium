/**
 * Delegation Workflow — validates that a persona can delegate a task to
 * another persona at runtime using the delegate_to_persona tool, and that
 * the delegated run is created and completes successfully.
 *
 * Ensemble:
 *   lead --[delegation]--> researcher
 *
 * Flow:
 *   1. Dispatch a run to lead
 *   2. Lead calls delegate_to_persona(targetPersona: "researcher", task: ...)
 *   3. Spawner validates the delegation edge exists and creates a child AgentRun
 *   4. Child run executes under the researcher persona's system prompt
 *   5. Child run completes (labeled with sympozium.ai/parent-run)
 *   6. Lead run completes
 *
 * This validates:
 *   - delegate_to_persona tool is available and functional
 *   - Spawner validates delegation edges in the relationship graph
 *   - Child run is created with correct parent-run label
 *   - Both runs complete successfully
 */

const ENSEMBLE = `cy-deleg-wf-${Date.now()}`;
const NS = "default";
const LEAD = "lead";
const RESEARCHER = "researcher";
const LEAD_INSTANCE = `${ENSEMBLE}-${LEAD}`;
const RESEARCHER_INSTANCE = `${ENSEMBLE}-${RESEARCHER}`;

function authHeaders(): Record<string, string> {
  const token = Cypress.env("API_TOKEN");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function waitForInstance(
  instanceName: string,
  timeoutMs = 60000,
): Cypress.Chainable<void> {
  const started = Date.now();
  const poll = (): Cypress.Chainable<void> => {
    return cy
      .request({
        url: `/api/v1/instances/${instanceName}?namespace=${NS}`,
        headers: authHeaders(),
        failOnStatusCode: false,
      })
      .then((resp): void => {
        if (resp.status === 200) return;
        if (Date.now() - started > timeoutMs) {
          throw new Error(
            `Instance ${instanceName} not created within ${timeoutMs}ms`,
          );
        }
        cy.wait(2000, { log: false });
        poll();
      }) as unknown as Cypress.Chainable<void>;
  };
  return poll();
}

/** Poll for an AgentRun matching a label selector. */
function waitForRunWithLabel(
  labelKey: string,
  labelValue: string,
  timeoutMs = 120000,
): Cypress.Chainable<string> {
  const started = Date.now();
  const poll = (): Cypress.Chainable<string> => {
    return cy
      .request({
        url: `/api/v1/runs?namespace=${NS}`,
        headers: authHeaders(),
      })
      .then((resp) => {
        const all = (Array.isArray(resp.body) ? resp.body : []) as Array<{
          metadata: { name: string; labels?: Record<string, string> };
        }>;
        const match = all.find(
          (r) => r.metadata.labels?.[labelKey] === labelValue,
        );
        if (match) {
          return cy.wrap(match.metadata.name);
        }
        if (Date.now() - started > timeoutMs) {
          throw new Error(
            `No run with label ${labelKey}=${labelValue} within ${timeoutMs}ms`,
          );
        }
        cy.wait(3000, { log: false });
        return poll();
      });
  };
  return poll();
}

describe("Delegation Workflow — delegate_to_persona runtime tool", () => {
  after(() => {
    cy.request({
      method: "PATCH",
      url: `/api/v1/ensembles/${ENSEMBLE}?namespace=${NS}`,
      headers: authHeaders(),
      body: { enabled: false },
      failOnStatusCode: false,
    });
    cy.wait(3000);
    cy.deleteEnsemble(ENSEMBLE);
    cy.deleteInstance(LEAD_INSTANCE);
    cy.deleteInstance(RESEARCHER_INSTANCE);
    cy.exec(
      `kubectl delete agentrun -n ${NS} -l sympozium.ai/instance=${LEAD_INSTANCE} --ignore-not-found --wait=false`,
      { failOnNonZeroExit: false },
    );
    cy.exec(
      `kubectl delete agentrun -n ${NS} -l sympozium.ai/instance=${RESEARCHER_INSTANCE} --ignore-not-found --wait=false`,
      { failOnNonZeroExit: false },
    );
  });

  it("creates an ensemble with a delegation edge", () => {
    cy.request({
      method: "POST",
      url: `/api/v1/ensembles?namespace=${NS}`,
      headers: authHeaders(),
      body: {
        name: ENSEMBLE,
        description:
          "Delegation: lead delegates research tasks to researcher at runtime",
        category: "test",
        workflowType: "delegation",
        personas: [
          {
            name: LEAD,
            displayName: "Research Lead",
            systemPrompt: `You are a research lead. Your ONLY job is to delegate research tasks to your team.

When you receive a task, you MUST immediately call the delegate_to_persona tool with:
  - targetPersona: "researcher"
  - task: the research question you were given

Do NOT attempt to answer the question yourself. Do NOT use any other tools.
Just delegate and report that you have delegated the task.`,
            model: "qwen/qwen3.5-9b",
            skills: ["memory"],
          },
          {
            name: RESEARCHER,
            displayName: "Researcher",
            systemPrompt: `You are a researcher. When given a task, answer it concisely with specific facts and numbers.

Do NOT use any tools. Just provide a direct, factual answer.`,
            model: "qwen/qwen3.5-9b",
            skills: ["memory"],
          },
        ],
        relationships: [
          {
            source: LEAD,
            target: RESEARCHER,
            type: "delegation",
            condition: "when research task is received",
            timeout: "10m",
          },
        ],
        sharedMemory: {
          enabled: true,
          storageSize: "512Mi",
          accessRules: [
            { persona: LEAD, access: "read-write" },
            { persona: RESEARCHER, access: "read-write" },
          ],
        },
      },
    }).then((resp) => {
      expect(resp.status).to.eq(201);
      expect(resp.body.spec.relationships).to.have.length(1);
      expect(resp.body.spec.relationships[0].type).to.eq("delegation");
      expect(resp.body.spec.relationships[0].source).to.eq(LEAD);
      expect(resp.body.spec.relationships[0].target).to.eq(RESEARCHER);
    });
  });

  it("activates the ensemble and waits for both instances", () => {
    cy.request({
      method: "PATCH",
      url: `/api/v1/ensembles/${ENSEMBLE}?namespace=${NS}`,
      headers: authHeaders(),
      body: {
        enabled: true,
        baseURL: "http://host.docker.internal:1234/v1",
        provider: "lm-studio",
        secretName: "",
      },
    }).then((resp) => {
      expect(resp.status).to.eq(200);
    });
    waitForInstance(LEAD_INSTANCE);
    waitForInstance(RESEARCHER_INSTANCE);
  });

  it("dispatches to lead which delegates to researcher via delegate_to_persona", () => {
    // Dispatch a run to the lead — the lead's system prompt instructs it
    // to delegate immediately to the researcher persona.
    cy.dispatchRun(
      LEAD_INSTANCE,
      "What is the approximate distance in kilometers between Tokyo and Sydney? Delegate this to the researcher.",
    ).then((leadRunName) => {
      // Wait for the delegated child run to appear.
      // The spawner labels child runs with "sympozium.ai/parent-run".
      cy.then(() =>
        waitForRunWithLabel(
          "sympozium.ai/parent-run",
          leadRunName,
          3 * 60 * 1000,
        ).then((childRunName) => {
          // Verify the child run is for the researcher instance
          cy.request({
            url: `/api/v1/runs/${childRunName}?namespace=${NS}`,
            headers: authHeaders(),
          }).then((resp) => {
            expect(resp.body.spec.instanceRef).to.eq(RESEARCHER_INSTANCE);
          });

          // Wait for the child (researcher) run to complete
          cy.waitForRunTerminal(childRunName, 5 * 60 * 1000).then((phase) => {
            expect(phase).to.eq("Succeeded");
          });

          // Verify the researcher produced a result
          cy.request({
            url: `/api/v1/runs/${childRunName}?namespace=${NS}`,
            headers: authHeaders(),
          }).then((resp) => {
            const result = (resp.body?.status?.result || "") as string;
            expect(
              result.length > 0,
              "researcher should produce a non-empty result",
            ).to.be.true;
          });
        }),
      );

      // Wait for the lead run to complete (it should finish after the delegate)
      cy.waitForRunTerminal(leadRunName, 5 * 60 * 1000).then((phase) => {
        expect(phase).to.eq("Succeeded");
      });
    });
  });

  it("shows both runs in the UI", () => {
    cy.visit("/runs");
    cy.contains(LEAD_INSTANCE, { timeout: 10000 }).should("exist");
    cy.contains(RESEARCHER_INSTANCE).should("exist");
  });

  it("shows the delegation edge on the workflow canvas", () => {
    cy.visit(`/ensembles/${ENSEMBLE}?tab=workflow`);
    cy.contains("Research Lead", { timeout: 10000 }).should("be.visible");
    cy.contains("Researcher").should("be.visible");
    cy.contains("2 personas with 1 relationship").should("be.visible");
  });
});

export {};
