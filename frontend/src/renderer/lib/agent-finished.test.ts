import { describe, expect, it } from "vitest";
import { type AgentActivityEntry, isLookingAtSession, takeFinishedAgents } from "./agent-finished";

function entry(sessionId: string, state: AgentActivityEntry["state"]): AgentActivityEntry {
	return { projectId: "proj", projectName: "Project", sessionId, title: `Session ${sessionId}`, state };
}

describe("takeFinishedAgents", () => {
	it("never alerts on the first reading, even for idle sessions", () => {
		const previous = new Map();
		expect(takeFinishedAgents(previous, [entry("a", "idle"), entry("b", "active")])).toEqual([]);
	});

	it("reports a session that went from active to idle, once", () => {
		const previous = new Map();
		takeFinishedAgents(previous, [entry("a", "active")]);
		expect(takeFinishedAgents(previous, [entry("a", "idle")])).toEqual([entry("a", "idle")]);
		expect(takeFinishedAgents(previous, [entry("a", "idle")])).toEqual([]);
	});

	it("ignores pauses for the user and process exits", () => {
		const previous = new Map();
		takeFinishedAgents(previous, [entry("a", "active"), entry("b", "active"), entry("c", "active")]);
		expect(
			takeFinishedAgents(previous, [entry("a", "waiting_input"), entry("b", "blocked"), entry("c", "exited")]),
		).toEqual([]);
	});

	it("does not treat an answered prompt that ends idle as a finished turn", () => {
		const previous = new Map();
		takeFinishedAgents(previous, [entry("a", "waiting_input")]);
		expect(takeFinishedAgents(previous, [entry("a", "idle")])).toEqual([]);
	});

	it("forgets sessions that left the reading", () => {
		const previous = new Map();
		takeFinishedAgents(previous, [entry("a", "active")]);
		takeFinishedAgents(previous, []);
		expect(previous.has("a")).toBe(false);
		expect(takeFinishedAgents(previous, [entry("a", "idle")])).toEqual([]);
	});
});

describe("isLookingAtSession", () => {
	const focused = { visibilityState: "visible" as const, hasFocus: () => true };

	it("is true only for the open local session in a visible, focused window", () => {
		expect(isLookingAtSession("a", { sessionId: "a" }, focused)).toBe(true);
		expect(isLookingAtSession("a", { sessionId: "b" }, focused)).toBe(false);
		expect(isLookingAtSession("a", {}, focused)).toBe(false);
		expect(isLookingAtSession("a", { hostId: "h", sessionId: "a" }, focused)).toBe(false);
	});

	it("is false when the window is hidden or unfocused", () => {
		expect(isLookingAtSession("a", { sessionId: "a" }, { visibilityState: "hidden", hasFocus: () => true })).toBe(false);
		expect(isLookingAtSession("a", { sessionId: "a" }, { visibilityState: "visible", hasFocus: () => false })).toBe(false);
	});
});
