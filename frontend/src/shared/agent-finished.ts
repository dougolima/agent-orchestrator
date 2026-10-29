/** Renderer -> main: a worker agent finished its turn while the user was not looking at it. */
export const AGENT_FINISHED_CHANNEL = "notifications:agentFinished";

export type AgentFinishedAlert = {
	projectId: string;
	sessionId: string;
	/** Localized toast title and body, built by the renderer. */
	title: string;
	body?: string;
};

const MAX_ALERT_TEXT = 512;

/** Validate an alert crossing the IPC boundary; anything malformed is dropped. */
export function parseAgentFinishedAlert(raw: unknown): AgentFinishedAlert | null {
	if (typeof raw !== "object" || raw === null) return null;
	const { projectId, sessionId, title, body } = raw as Record<string, unknown>;
	if (typeof projectId !== "string" || !projectId || typeof sessionId !== "string" || !sessionId) return null;
	if (typeof title !== "string" || !title) return null;
	if (body !== undefined && typeof body !== "string") return null;
	return {
		projectId,
		sessionId,
		title: title.slice(0, MAX_ALERT_TEXT),
		body: body ? body.slice(0, MAX_ALERT_TEXT) : undefined,
	};
}
