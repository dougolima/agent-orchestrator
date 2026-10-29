import type { SessionActivityState } from "../types/workspace";

/** The slice of a local worker session that decides whether it just finished a turn. */
export type AgentActivityEntry = {
	projectId: string;
	projectName: string;
	sessionId: string;
	title: string;
	state: SessionActivityState | undefined;
};

/**
 * Sessions that finished a turn since the previous reading: they were working
 * (`active`) and are now `idle`. Only a transition this runtime saw counts, so
 * sessions that were already idle when the app opened, or that appear for the
 * first time, never alert. A pause for the user (`waiting_input`/`blocked`) is
 * not a finish: the daemon's `needs_input` notification already covers it.
 *
 * `previous` is updated in place to the current reading, and sessions that
 * disappeared from it are dropped.
 */
export function takeFinishedAgents(
	previous: Map<string, SessionActivityState | undefined>,
	current: readonly AgentActivityEntry[],
): AgentActivityEntry[] {
	const finished: AgentActivityEntry[] = [];
	const seen = new Set<string>();
	for (const entry of current) {
		seen.add(entry.sessionId);
		if (previous.get(entry.sessionId) === "active" && entry.state === "idle") finished.push(entry);
		previous.set(entry.sessionId, entry.state);
	}
	for (const sessionId of previous.keys()) {
		if (!seen.has(sessionId)) previous.delete(sessionId);
	}
	return finished;
}

/**
 * Whether the user is looking at this session right now: its route is the one
 * open, and this window is both visible and focused. Visibility alone lies on
 * Windows and Linux, where an unfocused or covered window still reports
 * `visible`, so focus is required too.
 */
export function isLookingAtSession(
	sessionId: string,
	route: { hostId?: string; sessionId?: string },
	doc: Pick<Document, "visibilityState" | "hasFocus"> = document,
): boolean {
	if (route.hostId || route.sessionId !== sessionId) return false;
	return doc.visibilityState === "visible" && doc.hasFocus();
}
