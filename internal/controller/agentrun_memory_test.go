package controller

import (
	"testing"

	sympoziumv1alpha1 "github.com/sympozium-ai/sympozium/api/v1alpha1"
)

// ── buildContainers: MEMORY_SERVER_URL env injection ─────────────────────────

func TestBuildContainers_MemoryServerURLInjected(t *testing.T) {
	r := &AgentRunReconciler{}
	run := newTestRun()
	run.Spec.Skills = []sympoziumv1alpha1.SkillRef{
		{SkillPackRef: "memory"},
	}

	cs, _ := r.buildContainers(run, false, nil, nil, nil)

	// The agent container is always the first one.
	agentContainer := cs[0]

	var found bool
	for _, env := range agentContainer.Env {
		if env.Name == "MEMORY_SERVER_URL" {
			found = true
			expectedURL := "http://my-instance-memory.default.svc:8080"
			if env.Value != expectedURL {
				t.Errorf("MEMORY_SERVER_URL = %q, want %q", env.Value, expectedURL)
			}
			break
		}
	}
	if !found {
		t.Error("MEMORY_SERVER_URL env var not found on agent container when memory skill is attached")
	}
}

func TestBuildContainers_NoMemoryServerURLWithoutSkill(t *testing.T) {
	r := &AgentRunReconciler{}
	run := newTestRun()
	run.Spec.Skills = []sympoziumv1alpha1.SkillRef{
		{SkillPackRef: "k8s-ops"},
	}

	cs, _ := r.buildContainers(run, false, nil, nil, nil)

	agentContainer := cs[0]
	for _, env := range agentContainer.Env {
		if env.Name == "MEMORY_SERVER_URL" {
			t.Error("MEMORY_SERVER_URL should not be set without memory skill")
			return
		}
	}
}

// ── buildVolumes: no memory-db volume on agent pods ──────────────────────────

func TestBuildVolumes_NoMemoryDBVolume(t *testing.T) {
	r := &AgentRunReconciler{}
	run := newTestRun()
	run.Spec.Skills = []sympoziumv1alpha1.SkillRef{
		{SkillPackRef: "memory"},
	}

	vols := r.buildVolumes(run, false, nil, nil)

	for _, v := range vols {
		if v.Name == "memory-db" {
			t.Error("memory-db volume should not exist on agent pods (it belongs to the standalone memory Deployment)")
			return
		}
	}
}

func TestBuildVolumes_NoMemoryDBWithoutSkill(t *testing.T) {
	r := &AgentRunReconciler{}
	run := newTestRun()
	run.Spec.Skills = []sympoziumv1alpha1.SkillRef{
		{SkillPackRef: "k8s-ops"},
	}

	vols := r.buildVolumes(run, false, nil, nil)

	for _, v := range vols {
		if v.Name == "memory-db" {
			t.Error("memory-db volume should not exist without memory SkillPack")
			return
		}
	}
}
