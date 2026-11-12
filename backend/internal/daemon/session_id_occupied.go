package daemon

import (
	"os"
	"path/filepath"

	"github.com/aoagents/agent-orchestrator/backend/internal/domain"
)

// sessionWorkspaceOccupied reports whether something already sits at a path a
// new session with this id would materialize its workspace at, under the
// managed worktrees root. It mirrors the per-session layouts of the git
// worktree adapter (<project>/<id>, also the root of workspace projects) and
// the scratch adapter (<project>/workers|orchestrators/<id>, and
// standalone/sessions/<id>). Git orchestrators live at a prefix-derived path
// that does not contain the id, so they need no check.
//
// Only a path that is known to exist counts as occupied: a stat error other
// than "exists" must not keep the allocator skipping numbers.
func sessionWorkspaceOccupied(worktreesRoot string) func(domain.ProjectID, domain.SessionID) bool {
	return func(projectID domain.ProjectID, id domain.SessionID) bool {
		var candidates []string
		if projectID == "" {
			candidates = []string{filepath.Join(worktreesRoot, "standalone", "sessions", string(id))}
		} else {
			project := filepath.Join(worktreesRoot, string(projectID))
			candidates = []string{
				filepath.Join(project, string(id)),
				filepath.Join(project, "workers", string(id)),
				filepath.Join(project, "orchestrators", string(id)),
			}
		}
		for _, candidate := range candidates {
			if _, err := os.Lstat(candidate); err == nil {
				return true
			}
		}
		return false
	}
}
