import { beforeEach, describe, expect, it, vi } from "vitest";

const getUiSettings = vi.fn();
const setUiSettings = vi.fn();

vi.mock("../lib/bridge", () => ({
	aoBridge: {
		uiSettings: {
			get: (...args: unknown[]) => getUiSettings(...args),
			set: (...args: unknown[]) => setUiSettings(...args),
		},
	},
}));

import { useAgentFinishedNotificationsStore } from "./agent-finished-notifications-store";

describe("agent-finished-notifications-store", () => {
	beforeEach(() => {
		getUiSettings.mockReset();
		setUiSettings.mockReset();
		getUiSettings.mockResolvedValue({ locale: "en", agentFinishedNotificationsEnabled: true });
		setUiSettings.mockImplementation(async (settings: { agentFinishedNotificationsEnabled: boolean }) => settings);
		useAgentFinishedNotificationsStore.setState({ enabled: true, loaded: false, saving: false, saveError: false });
	});

	it("defaults to enabled before load", () => {
		expect(useAgentFinishedNotificationsStore.getState().enabled).toBe(true);
	});

	it("loads the persisted setting from the main process", async () => {
		getUiSettings.mockResolvedValue({ locale: "en", agentFinishedNotificationsEnabled: false });
		await useAgentFinishedNotificationsStore.getState().load();
		expect(useAgentFinishedNotificationsStore.getState()).toMatchObject({ enabled: false, loaded: true });
	});

	it("persists only its own field", async () => {
		await useAgentFinishedNotificationsStore.getState().setEnabled(false);
		expect(setUiSettings).toHaveBeenCalledWith({ agentFinishedNotificationsEnabled: false });
		expect(useAgentFinishedNotificationsStore.getState()).toMatchObject({ enabled: false, saving: false, saveError: false });
	});

	it("keeps the previous value and flags an error when saving fails", async () => {
		setUiSettings.mockRejectedValue(new Error("disk full"));
		await useAgentFinishedNotificationsStore.getState().setEnabled(false);
		expect(useAgentFinishedNotificationsStore.getState()).toMatchObject({ enabled: true, saving: false, saveError: true });
	});
});
