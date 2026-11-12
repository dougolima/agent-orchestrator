package daemon

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
)

func TestSessionWorkspaceOccupiedMatchesManagedLayouts(t *testing.T) {
	root := t.TempDir()
	for _, rel := range []string{
		"proj/proj-1",                      // git worktree / workspace project root
		"proj/workers/proj-2",              // scratch worker
		"proj/orchestrators/proj-3",        // scratch orchestrator
		"standalone/sessions/standalone-4", // standalone scratch
		"other/proj-5",                     // another project's tree
	} {
		if err := os.MkdirAll(filepath.Join(root, rel), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	occupied := sessionWorkspaceOccupied(root)

	for _, tc := range []struct {
		project domain.ProjectID
		id      domain.SessionID
		want    bool
	}{
		{"proj", "proj-1", true},
		{"proj", "proj-2", true},
		{"proj", "proj-3", true},
		{"", "standalone-4", true},
		{"proj", "proj-5", false},
		{"proj", "proj-6", false},
		{"", "standalone-1", false},
		{"missing", "missing-1", false},
	} {
		if got := occupied(tc.project, tc.id); got != tc.want {
			t.Errorf("occupied(%q, %q) = %v, want %v", tc.project, tc.id, got, tc.want)
		}
	}
}
