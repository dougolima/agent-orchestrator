import { describe, expect, it } from "vitest";
import { repositoryOwnerAvatar, repositoryOwnerAvatars } from "./ProjectOwnerAvatar";

describe("repositoryOwnerAvatar", () => {
	it.each([
		["https://github.com/acme/web.git", "acme", "https://github.com/acme.png?size=64"],
		["git@github.com:acme/web.git", "acme", "https://github.com/acme.png?size=64"],
		["github.com/acme/web", "acme", "https://github.com/acme.png?size=64"],
		["https://gitlab.com/group/app", "group", "https://gitlab.com/-/avatar?username=group"],
		["https://bitbucket.org/team/app", "team", "https://bitbucket.org/account/team/avatar/64/"],
		["git@git.example.com:infra/app.git", "infra", "https://unavatar.io/git.example.com/infra"],
	])("reads the owner of %s", (repo, owner, url) => {
		expect(repositoryOwnerAvatar(repo)).toEqual({ owner, url });
	});

	it("has no avatar for a repository without an owner", () => {
		expect(repositoryOwnerAvatar("")).toBeNull();
		expect(repositoryOwnerAvatar("https://github.com/")).toBeNull();
	});
});

describe("repositoryOwnerAvatars", () => {
	it("shows each owner once, in repository order", () => {
		expect(repositoryOwnerAvatars([
			{ repo: "git@github.com:acme/web.git" },
			{ repo: "https://github.com/ACME/api" },
			{ repo: "https://github.com/partner/sdk" },
		]).map((avatar) => avatar.owner)).toEqual(["acme", "partner"]);
	});
});
