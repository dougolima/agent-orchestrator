package store_test

import (
	"context"
	"testing"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
)

// A number whose workspace directory is still on disk is skipped, and the
// number after it stays allocated from there on.
func TestCreateSessionSkipsIDsWhoseWorkspaceIsOccupied(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedProject(t, s, "occ")
	occupied := map[domain.SessionID]bool{"occ-1": true, "occ-2": true}
	var asked []domain.ProjectID
	s.SetSessionIDOccupied(func(projectID domain.ProjectID, id domain.SessionID) bool {
		asked = append(asked, projectID)
		return occupied[id]
	})

	first, err := s.CreateSession(ctx, sampleRecord("occ"))
	if err != nil {
		t.Fatal(err)
	}
	if first.ID != "occ-3" {
		t.Fatalf("first id = %s, want occ-3 past the two occupied numbers", first.ID)
	}
	for _, projectID := range asked {
		if projectID != "occ" {
			t.Fatalf("occupied check got project %q, want occ", projectID)
		}
	}

	occupied["occ-5"] = true
	second, err := s.CreateSession(ctx, sampleRecord("occ"))
	if err != nil {
		t.Fatal(err)
	}
	if second.ID != "occ-4" {
		t.Fatalf("second id = %s, want occ-4", second.ID)
	}
	third, err := s.CreateSession(ctx, sampleRecord("occ"))
	if err != nil {
		t.Fatal(err)
	}
	if third.ID != "occ-6" {
		t.Fatalf("third id = %s, want occ-6 past occupied occ-5", third.ID)
	}
}

func TestCreateSessionSkipsOccupiedStandaloneIDs(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	s.SetSessionIDOccupied(func(projectID domain.ProjectID, id domain.SessionID) bool {
		return projectID == "" && id == "standalone-1"
	})

	rec, err := s.CreateSession(ctx, sampleRecord(""))
	if err != nil {
		t.Fatal(err)
	}
	if rec.ID != "standalone-2" {
		t.Fatalf("id = %s, want standalone-2", rec.ID)
	}
}
