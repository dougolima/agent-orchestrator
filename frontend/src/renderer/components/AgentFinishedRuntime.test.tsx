import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentActivityEntry } from "../lib/agent-finished";

const agentFinished = vi.fn();
let sessions: AgentActivityEntry[] | undefined;
let route: { hostId?: string; sessionId?: string } = {};

vi.mock("../hooks/useWorkspaceQuery", () => ({
	useWorkspaceAgentActivity: () => ({ data: sessions }),
}));
vi.mock("@tanstack/react-router", () => ({
	useParams: () => route,
}));
vi.mock("../lib/bridge", () => ({
	aoBridge: {
		notifications: { agentFinished: (...args: unknown[]) => agentFinished(...args) },
		uiSettings: { get: async () => ({ agentFinishedNotificationsEnabled: true }), set: async () => undefined },
	},
}));

import { useAgentFinishedNotificationsStore } from "../stores/agent-finished-notifications-store";
import { AgentFinishedRuntime } from "./AgentFinishedRuntime";

function entry(sessionId: string, state: AgentActivityEntry["state"]): AgentActivityEntry {
	return { projectId: "proj", projectName: "My project", sessionId, title: `Task ${sessionId}`, state };
}

describe("AgentFinishedRuntime", () => {
	beforeEach(() => {
		agentFinished.mockReset();
		sessions = undefined;
		route = {};
		useAgentFinishedNotificationsStore.setState({ enabled: true, loaded: true, saving: false, saveError: false });
		vi.spyOn(document, "hasFocus").mockReturnValue(true);
	});

	it("alerts when a session the user is not viewing finishes its turn", () => {
		route = { sessionId: "other" };
		sessions = [entry("a", "active")];
		const view = render(<AgentFinishedRuntime />);
		expect(agentFinished).not.toHaveBeenCalled();

		sessions = [entry("a", "idle")];
		view.rerender(<AgentFinishedRuntime />);
		expect(agentFinished).toHaveBeenCalledTimes(1);
		expect(agentFinished).toHaveBeenCalledWith(
			expect.objectContaining({ projectId: "proj", sessionId: "a", title: expect.stringContaining("Task a") }),
		);
	});

	it("stays quiet for the session on screen", () => {
		route = { sessionId: "a" };
		sessions = [entry("a", "active")];
		const view = render(<AgentFinishedRuntime />);
		sessions = [entry("a", "idle")];
		view.rerender(<AgentFinishedRuntime />);
		expect(agentFinished).not.toHaveBeenCalled();
	});

	it("alerts for the open session when the window is not focused", () => {
		route = { sessionId: "a" };
		vi.spyOn(document, "hasFocus").mockReturnValue(false);
		sessions = [entry("a", "active")];
		const view = render(<AgentFinishedRuntime />);
		sessions = [entry("a", "idle")];
		view.rerender(<AgentFinishedRuntime />);
		expect(agentFinished).toHaveBeenCalledTimes(1);
	});

	it("does nothing while the option is off, and does not replay once it is turned on", () => {
		useAgentFinishedNotificationsStore.setState({ enabled: false });
		sessions = [entry("a", "active")];
		const view = render(<AgentFinishedRuntime />);
		sessions = [entry("a", "idle")];
		view.rerender(<AgentFinishedRuntime />);
		expect(agentFinished).not.toHaveBeenCalled();

		useAgentFinishedNotificationsStore.setState({ enabled: true });
		view.rerender(<AgentFinishedRuntime />);
		expect(agentFinished).not.toHaveBeenCalled();
	});
});
