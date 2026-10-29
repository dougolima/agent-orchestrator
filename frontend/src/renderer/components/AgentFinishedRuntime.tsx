import { useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useWorkspaceAgentActivity } from "../hooks/useWorkspaceQuery";
import { isLookingAtSession, takeFinishedAgents } from "../lib/agent-finished";
import { aoBridge } from "../lib/bridge";
import { useAgentFinishedNotificationsStore } from "../stores/agent-finished-notifications-store";
import type { SessionActivityState } from "../types/workspace";

/**
 * Alerts (sound + OS toast) when a local worker agent finishes its turn while
 * the user is not looking at that session. A finished turn is an `active` to
 * `idle` transition in the workspace query; the daemon records no notification
 * for it, so nothing lands in the notification center either.
 */
export function AgentFinishedRuntime() {
	const { t } = useTranslation();
	const sessions = useWorkspaceAgentActivity().data;
	const enabled = useAgentFinishedNotificationsStore((state) => state.enabled);
	const params = useParams({ strict: false }) as { hostId?: string; sessionId?: string };
	const routeRef = useRef(params);
	routeRef.current = params;
	const previous = useRef(new Map<string, SessionActivityState | undefined>());

	useEffect(() => {
		void useAgentFinishedNotificationsStore.getState().load();
	}, []);

	useEffect(() => {
		if (!sessions) return;
		// Track transitions even while disabled, so turning the option on never
		// replays a turn that finished before.
		const finished = takeFinishedAgents(previous.current, sessions);
		if (!enabled) return;
		for (const session of finished) {
			if (isLookingAtSession(session.sessionId, routeRef.current)) continue;
			aoBridge.notifications.agentFinished({
				projectId: session.projectId,
				sessionId: session.sessionId,
				title: t("notifications.agentFinished.title", { session: session.title.trim() || session.sessionId }),
				body: t("notifications.agentFinished.body", { project: session.projectName }),
			});
		}
	}, [enabled, sessions, t]);

	return null;
}
