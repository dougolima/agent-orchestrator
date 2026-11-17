import { describe, expect, it } from "vitest";
import { githubProfileAvatarUrl, repositoryOwnerAvatar } from "./repository-avatar";

describe("repositoryOwnerAvatar", () => {
	it("uses the remote owner before GitHub has answered", () => {
		expect(repositoryOwnerAvatar("https://github.com/acme/widgets.git")).toEqual({
			owner: "acme",
			url: "https://avatars.githubusercontent.com/acme?s=64",
		});
	});

	it("uses GitHub's canonical owner and id-based avatar for a renamed repository", () => {
		const canonical = { repo: "OrchestratorInc/agent-orchestrator", ownerAvatarUrl: "https://avatars.githubusercontent.com/u/310302959?v=4" };
		expect(repositoryOwnerAvatar("https://github.com/Untrivial-ai/agent-orchestrator.git", canonical)).toEqual({
			owner: "OrchestratorInc",
			url: "https://avatars.githubusercontent.com/u/310302959?v=4&s=64",
		});
		expect(repositoryOwnerAvatar("git@github.com:Untrivial-ai/agent-orchestrator.git", canonical)?.owner).toBe("OrchestratorInc");
	});

	it("falls back to the canonical login when no id-based avatar is known", () => {
		expect(repositoryOwnerAvatar("https://github.com/Untrivial-ai/agent-orchestrator", { repo: "OrchestratorInc/agent-orchestrator" })?.url)
			.toBe("https://avatars.githubusercontent.com/OrchestratorInc?s=64");
	});

	it("never loads an avatar from another host", () => {
		expect(repositoryOwnerAvatar("https://github.com/acme/widgets", { repo: "acme/widgets", ownerAvatarUrl: "https://evil.example/a.png" })?.url)
			.toBe("https://avatars.githubusercontent.com/acme?s=64");
	});

	it("ignores a malformed canonical repository", () => {
		expect(repositoryOwnerAvatar("https://github.com/acme/widgets", { repo: "not a repo" })?.owner).toBe("acme");
	});

	it("applies canonical data only to github.com remotes", () => {
		const canonical = { repo: "other/widgets", ownerAvatarUrl: "https://avatars.githubusercontent.com/u/1?v=4" };
		expect(repositoryOwnerAvatar("https://gitlab.com/acme/widgets", canonical)?.owner).toBe("acme");
		expect(repositoryOwnerAvatar("https://git.internal.example/acme/widgets", canonical)).toBeNull();
	});
});

describe("githubProfileAvatarUrl", () => {
	it("points a by-name GitHub avatar at the owner's profile image", () => {
		const avatar = repositoryOwnerAvatar("https://github.com/stone-payments/stone-ai-apps");
		expect(avatar?.url).toBe("https://avatars.githubusercontent.com/stone-payments?s=64");
		expect(githubProfileAvatarUrl(avatar!.url)).toBe("https://github.com/stone-payments.png?size=64");
	});

	it("has no profile image for other hosts or id-based avatars", () => {
		expect(githubProfileAvatarUrl("https://gitlab.com/-/avatar?username=someone")).toBeNull();
		expect(githubProfileAvatarUrl("https://avatars.githubusercontent.com/u/8750624?v=4")).toBeNull();
		expect(githubProfileAvatarUrl("not a url")).toBeNull();
	});
});
