import { describe, expect, it } from "vitest";
import { githubProfileAvatarUrl, repositoryOwnerAvatar } from "./repository-avatar";

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
