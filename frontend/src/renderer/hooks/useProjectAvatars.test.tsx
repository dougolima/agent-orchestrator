import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceSummary } from "../types/workspace";

const getProject = vi.fn();

vi.mock("../lib/api-client", () => ({
	apiClient: { GET: (...args: unknown[]) => getProject(...args) },
}));

import { useUiStore } from "../stores/ui-store";
import { loadAvatar, useProjectAvatars } from "./useProjectAvatars";

const STONE = "https://avatars.githubusercontent.com/stone-payments?s=64";
const STONE_PROFILE = "https://github.com/stone-payments.png?size=64";
const DOUG = "https://avatars.githubusercontent.com/dougolima?s=64";

// Stands in for the browser image: each URL decodes at the width given here,
// as GitHub resizes a real avatar and serves its placeholder at full size.
let widths: Record<string, number> = {};

class FakeImage {
	crossOrigin = "";
	naturalWidth = 0;
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	set src(url: string) {
		queueMicrotask(() => {
			const width = widths[url];
			if (width === undefined) return this.onerror?.();
			this.naturalWidth = width;
			this.onload?.();
		});
	}
}

function workspace(id: string): WorkspaceSummary {
	return { id, name: id, path: `/repos/${id}`, kind: "local", sessions: [] } as unknown as WorkspaceSummary;
}

function wrapper({ children }: { children: ReactNode }) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("project avatars", () => {
	beforeEach(() => {
		widths = {};
		window.localStorage.clear();
		vi.stubGlobal("Image", FakeImage);
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: () => undefined } as never);
		vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,avatar");
		useUiStore.setState({ projectAvatars: true, newSidebarDesign: true, developerMode: false });
		getProject.mockImplementation(async (_path: string, init: { params: { path: { id: string } } }) => {
			const repo = init.params.path.id === "stone" ? "https://github.com/stone-payments/stone-ai-apps" : "https://github.com/dougolima/second-brain";
			return { data: { status: "ok", project: { repo } } };
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("tells GitHub's full-size placeholder apart from a resized avatar", async () => {
		widths = { [STONE]: 420, [DOUG]: 64 };
		await expect(loadAvatar(STONE)).resolves.toEqual({ placeholder: true });
		await expect(loadAvatar(DOUG)).resolves.toEqual({ src: "data:image/png;base64,avatar" });
		await expect(loadAvatar("https://avatars.githubusercontent.com/missing?s=64")).resolves.toBeNull();
	});

	it("shows the owner's profile image instead of a placeholder, and remembers it", async () => {
		widths = { [STONE]: 420, [DOUG]: 64 };
		window.localStorage.setItem("ao.projectAvatarCache", JSON.stringify({ [STONE]: "data:image/png;base64,placeholder" }));
		const { result } = renderHook(() => useProjectAvatars([workspace("stone"), workspace("doug")]), { wrapper });

		await waitFor(() => expect(result.current.get("stone")).toBe(STONE_PROFILE));
		await waitFor(() => expect(result.current.get("doug")).toBe("data:image/png;base64,avatar"));
		expect(JSON.parse(window.localStorage.getItem("ao.projectAvatarFallbacks") ?? "{}")).toEqual({ [STONE]: STONE_PROFILE });
		expect(JSON.parse(window.localStorage.getItem("ao.projectAvatarCache") ?? "{}")).not.toHaveProperty(STONE);
	});
});
