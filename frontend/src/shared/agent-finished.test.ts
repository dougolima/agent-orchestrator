import { describe, expect, it } from "vitest";
import { parseAgentFinishedAlert } from "./agent-finished";

describe("parseAgentFinishedAlert", () => {
	it("accepts a well-formed alert", () => {
		expect(parseAgentFinishedAlert({ projectId: "p", sessionId: "s", title: "Done", body: "Body" })).toEqual({
			projectId: "p",
			sessionId: "s",
			title: "Done",
			body: "Body",
		});
		expect(parseAgentFinishedAlert({ projectId: "p", sessionId: "s", title: "Done" })).toEqual({
			projectId: "p",
			sessionId: "s",
			title: "Done",
			body: undefined,
		});
	});

	it("drops malformed alerts", () => {
		expect(parseAgentFinishedAlert(null)).toBeNull();
		expect(parseAgentFinishedAlert({ projectId: "", sessionId: "s", title: "Done" })).toBeNull();
		expect(parseAgentFinishedAlert({ projectId: "p", sessionId: 1, title: "Done" })).toBeNull();
		expect(parseAgentFinishedAlert({ projectId: "p", sessionId: "s", title: "" })).toBeNull();
		expect(parseAgentFinishedAlert({ projectId: "p", sessionId: "s", title: "Done", body: 3 })).toBeNull();
	});

	it("caps oversized text", () => {
		const alert = parseAgentFinishedAlert({ projectId: "p", sessionId: "s", title: "x".repeat(2000) });
		expect(alert?.title).toHaveLength(512);
	});
});
