import { cn } from "../lib/utils";

/** The owner of a project's repository, and where that host serves its avatar. */
export type ProjectOwnerAvatarInfo = { owner: string; url: string };

export function repositoryOwnerAvatar(repo: string): ProjectOwnerAvatarInfo | null {
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
	const owner = pathname.replace(/^\/+|\/+$/g, "").split("/")[0]?.replace(/\.git$/, "");
	if (!owner) return null;
	const encodedOwner = encodeURIComponent(owner);
	if (host === "github.com") return { owner, url: `https://github.com/${encodedOwner}.png?size=64` };
	if (host === "gitlab.com") return { owner, url: `https://gitlab.com/-/avatar?username=${encodedOwner}` };
	if (host === "bitbucket.org") return { owner, url: `https://bitbucket.org/account/${encodedOwner}/avatar/64/` };
	return { owner, url: `https://unavatar.io/${encodeURIComponent(host)}/${encodedOwner}` };
}

/**
 * One avatar per repository owner, primary repository first. Several repositories
 * under one owner are one identity, so the owner appears once.
 */
export function repositoryOwnerAvatars(repositories: readonly { repo: string }[]): ProjectOwnerAvatarInfo[] {
	const seen = new Set<string>();
	return repositories.flatMap(({ repo }) => {
		const avatar = repositoryOwnerAvatar(repo);
		if (!avatar) return [];
		const identity = `${new URL(avatar.url).hostname}/${avatar.owner.toLowerCase()}`;
		if (seen.has(identity)) return [];
		seen.add(identity);
		return [avatar];
	});
}

export function ProjectOwnerAvatar({ avatar, className }: { avatar: ProjectOwnerAvatarInfo; className: string }) {
	return (
		<span
			className={cn(
				"relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-card bg-muted font-medium text-muted-foreground",
				className,
			)}
			aria-hidden="true"
		>
			<span className="text-[0.65em] leading-none">{avatar.owner.charAt(0).toUpperCase()}</span>
			<img
				key={avatar.url}
				width={18}
				height={18}
				className="absolute inset-0 size-full rounded-full object-cover"
				src={avatar.url}
				alt=""
				onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
			/>
		</span>
	);
}
