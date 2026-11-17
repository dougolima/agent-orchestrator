// What the daemon learned from GitHub about a github.com remote: the current
// owner/name, which differs after a rename or transfer, and the owner's
// id-based avatar URL.
export type CanonicalGitHubRepo = { repo?: string; ownerAvatarUrl?: string };

export function repositoryOwnerAvatar(repo: string, canonical?: CanonicalGitHubRepo): { owner: string; url: string } | null {
	const value = repo.trim();
	const scp = value.match(/^[^/@:\s]+@([^/:\s]+):(.+)$/);
	let host: string;
	let pathname: string;
	if (scp?.[1] && scp[2]) {
		host = scp[1].toLowerCase();
		pathname = scp[2];
	} else {
		try {
			const parsed = new URL(value.includes("://") ? value : `https://${value}`);
			host = parsed.hostname.toLowerCase();
			pathname = parsed.pathname;
		} catch {
			return null;
		}
	}
	const canonicalOwner = host === "github.com" ? canonical?.repo?.match(/^([^/\s]+)\/[^/\s]+$/)?.[1] : undefined;
	const owner = canonicalOwner ?? pathname.replace(/^\/+|\/+$/g, "").split("/")[0]?.replace(/\.git$/, "");
	if (!owner) return null;
	const encodedOwner = encodeURIComponent(owner);
	// The avatars host serves the image directly with CORS, so it can be cached
	// as a data URL. github.com/<owner>.png is an uncached redirect to it.
	if (host === "github.com") {
		// The login-based URL can answer a live org, and always a renamed
		// login, with GitHub's placeholder, so the id-based URL wins.
		const idUrl = canonicalOwner ? githubAvatarUrl(canonical?.ownerAvatarUrl) : null;
		return { owner, url: idUrl ?? `https://avatars.githubusercontent.com/${encodedOwner}?s=64` };
	}
	if (host === "gitlab.com") return { owner, url: `https://gitlab.com/-/avatar?username=${encodedOwner}` };
	if (host === "bitbucket.org") return { owner, url: `https://bitbucket.org/account/${encodedOwner}/avatar/64/` };
	// Any other host (self-hosted, an SSH alias, a local path) gets no avatar:
	// sending it to a third-party lookup would leak internal host and org names.
	return null;
}

/**
 * The github.com/<owner>.png address for a by-name GitHub avatar URL, or null
 * for any other URL. GitHub serves some organizations' avatars only by account
 * id: the by-name URL answers with its generic placeholder, while
 * github.com/<owner>.png redirects to the id URL. That redirect carries no
 * CORS header, so the image shows in an <img> but cannot be cached.
 */
export function githubProfileAvatarUrl(avatarUrl: string): string | null {
	let parsed: URL;
	try {
		parsed = new URL(avatarUrl);
	} catch {
		return null;
	}
	if (parsed.hostname !== "avatars.githubusercontent.com") return null;
	const owner = parsed.pathname.replace(/^\/+/, "");
	if (!owner || owner.includes("/")) return null;
	return `https://github.com/${owner}.png?size=64`;
}

function githubAvatarUrl(raw: string | undefined): string | null {
	if (!raw) return null;
	try {
		const url = new URL(raw);
		if (url.protocol !== "https:" || url.hostname !== "avatars.githubusercontent.com") return null;
		url.searchParams.set("s", "64");
		return url.toString();
	} catch {
		return null;
	}
}
