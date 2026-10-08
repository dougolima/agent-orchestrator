import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiClient, apiErrorMessage } from "../lib/api-client";
import { repositoryOwnerAvatars, type ProjectOwnerAvatarInfo } from "../components/ProjectOwnerAvatar";
import {
	CLOUD_PROJECT_KIND,
	STANDALONE_PROJECT_KIND,
	STANDALONE_WORKSPACE_ID,
	type WorkspaceSummary,
} from "../types/workspace";

type ProjectDetails = Awaited<ReturnType<typeof fetchProjectDetails>>;

async function fetchProjectDetails(projectId: string) {
	const { data, error } = await apiClient.GET("/api/v1/projects/{id}", {
		params: { path: { id: projectId } },
	});
	if (error) throw new Error(apiErrorMessage(error));
	if (data?.status !== "ok") return undefined;
	return data.project;
}

// Shares the ["project", id] entry with the composer and project settings, which
// read the same project details.
function projectDetailsQuery(projectId: string, enabled: boolean) {
	return {
		queryKey: ["project", projectId],
		enabled,
		staleTime: 30_000,
		queryFn: () => fetchProjectDetails(projectId),
	};
}

/**
 * Only a local project has details to read here. A remote or cloud summary
 * already carries what its host reports, and the Scratchpad has no repository.
 */
function readsProjectDetails(project: WorkspaceSummary): boolean {
	return (
		!project.hostId &&
		project.kind !== CLOUD_PROJECT_KIND &&
		project.kind !== STANDALONE_PROJECT_KIND &&
		project.id !== STANDALONE_WORKSPACE_ID
	);
}

function projectAvatars(project: WorkspaceSummary, details: ProjectDetails | undefined): ProjectOwnerAvatarInfo[] {
	if (project.id === STANDALONE_WORKSPACE_ID || project.kind === STANDALONE_PROJECT_KIND) return [];
	const primaryRepo = details && "repo" in details && typeof details.repo === "string" ? details.repo : "";
	const workspaceRepos = details && "workspaceRepos" in details ? details.workspaceRepos ?? [] : project.workspaceRepos ?? [];
	return repositoryOwnerAvatars([...(primaryRepo ? [{ repo: primaryRepo }] : []), ...workspaceRepos]);
}

/** Repository-owner avatars for each project, keyed by project id. */
export function useProjectOwnerAvatars(
	projects: readonly WorkspaceSummary[],
	{ enabled = true }: { enabled?: boolean } = {},
): ReadonlyMap<string, ProjectOwnerAvatarInfo[]> {
	const localProjects = useMemo(() => projects.filter(readsProjectDetails), [projects]);
	const details = useQueries({
		queries: localProjects.map((project) => projectDetailsQuery(project.id, enabled)),
	});
	return useMemo(() => new Map(projects.map((project) => {
		const index = localProjects.findIndex((localProject) => localProject.id === project.id);
		return [project.id, projectAvatars(project, index >= 0 ? details[index]?.data : undefined)] as const;
	})), [details, localProjects, projects]);
}

/** The primary repository owner's avatar for one project, when it has one. */
export function useProjectOwnerAvatar(project: WorkspaceSummary): ProjectOwnerAvatarInfo | undefined {
	const local = readsProjectDetails(project);
	const details = useQuery(projectDetailsQuery(project.id, local));
	return useMemo(
		() => projectAvatars(project, local ? details.data : undefined)[0],
		[details.data, local, project],
	);
}
