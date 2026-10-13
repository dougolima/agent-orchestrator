import * as Dialog from "@radix-ui/react-dialog";
import { StickyNote } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useUiStore } from "../stores/ui-store";
import { useTranslation } from "react-i18next";
import { useProjectOwnerAvatars } from "../hooks/useProjectOwnerAvatars";
import { useRemoteWorkspaces, useWorkspaceQuery } from "../hooks/useWorkspaceQuery";
import { labelForHost } from "../lib/host-clients";
import { ProjectOwnerAvatar } from "./ProjectOwnerAvatar";
import { TaskComposer } from "./TaskComposer";
import { STANDALONE_WORKSPACE_ID, STANDALONE_PROJECT_KIND } from "../types/workspace";
import { SettingsOptionMenu } from "./settings/SettingsOptionMenu";

type NewTaskDialogProps = {
	open: boolean;
	projectId?: string;
	hostId?: string;
	onProjectChange?: (projectId: string) => void;
	onCreated: (sessionId: string) => void;
	onOpenChange: (open: boolean) => void;
};

export function NewTaskDialog({ open, projectId, hostId, onProjectChange, onCreated, onOpenChange }: NewTaskDialogProps) {
	const { t } = useTranslation();
	// Settings opens as a page in the center pane; step aside so it is not hidden behind this modal.
	const settingsOpen = useUiStore((state) => state.settingsModal?.scope === "global");
	const localWorkspaces = useWorkspaceQuery({ subscribed: open }).data ?? [];
	const remoteWorkspaces = useRemoteWorkspaces({ subscribed: open }).data ?? [];
	const workspaces = hostId ? remoteWorkspaces.filter((workspace) => workspace.hostId === hostId) : localWorkspaces;
	const projects = useMemo(() => workspaces.filter(
		(workspace) => workspace.id !== STANDALONE_WORKSPACE_ID && workspace.kind !== STANDALONE_PROJECT_KIND,
	), [workspaces]);
	const projectAvatars = useProjectOwnerAvatars(projects, { enabled: open });
	const selectedProjectId = projectId ?? STANDALONE_WORKSPACE_ID;
	const selectedProject = projects.find((project) => project.id === selectedProjectId);
	const selectedProjectName = selectedProject?.name ?? t("standalone.workspaceName");
	const selectedProjectAvatar = projectAvatars.get(selectedProjectId)?.[0];
	const projectOptions = [
		{ value: STANDALONE_WORKSPACE_ID, label: t("standalone.workspaceName") },
		...projects.map((project) => ({ value: project.id, label: project.name })),
	];
	useEffect(() => {
		if (!open) return;
		for (const avatars of projectAvatars.values()) {
			for (const avatar of avatars) {
				const image = new Image();
				image.src = avatar.url;
			}
		}
	}, [open, projectAvatars]);
	return (
		<Dialog.Root open={open && !settingsOpen} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="dialog-overlay data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
				<Dialog.Content className="fixed left-1/2 top-1/2 z-overlay w-dialog-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out motion-reduce:animate-none">
					{/* The selected project is the dialog title; the composer remains the main surface. */}
					<Dialog.Title className="settings-dialog-title flex flex-wrap items-center gap-x-1.5 px-3 pt-3">
						<SettingsOptionMenu
							aria-label={t("newTask.project")}
							value={selectedProjectId}
							options={projectOptions}
							onChange={(value) => onProjectChange?.(value)}
							menuAlign="start"
							menuClassName="w-48 max-h-72"
							triggerClassName="w-fit max-w-[45vw] min-w-0 gap-1 rounded-md bg-transparent! px-1! py-0! text-[length:inherit]! font-semibold leading-[inherit]! text-foreground hover:bg-interactive-hover! hover:text-foreground data-[state=open]:bg-transparent! data-[state=open]:hover:bg-interactive-hover! data-[state=open]:text-foreground"
							menuItemClassName="gap-1!"
							renderTrigger={() => (
								<span className="inline-flex min-w-0 items-center gap-1.5">
									{selectedProjectId === STANDALONE_WORKSPACE_ID ? (
										<StickyNote aria-hidden="true" className="size-[0.85em] shrink-0 -translate-y-px text-muted-foreground" />
									) : selectedProjectAvatar ? (
										<ProjectOwnerAvatar avatar={selectedProjectAvatar} className="size-[1em]" />
									) : <StickyNote aria-hidden="true" className="size-[0.85em] shrink-0 -translate-y-px text-muted-foreground" />}
									<span className="min-w-0 -translate-y-px truncate">{selectedProjectName}</span>
								</span>
							)}
							renderMenuItem={(option) => {
								const avatars = projectAvatars.get(option.value) ?? [];
								return (
									<>
										<span className="relative flex w-5 shrink-0 items-center justify-center">
											{option.value === STANDALONE_WORKSPACE_ID ? (
												<StickyNote aria-hidden="true" className="size-4! -translate-y-px text-muted-foreground" />
											) : (
												<span className="flex items-center -space-x-2">
													{avatars.slice(0, 2).map((avatar) => (
														<ProjectOwnerAvatar key={`${avatar.owner}:${avatar.url}`} avatar={avatar} className="size-[18px]" />
													))}
												</span>
											)}
											{avatars.length > 2 ? <span className="absolute -bottom-1 -right-1 flex size-3 items-center justify-center rounded-full border border-card bg-muted text-[8px] text-muted-foreground">+{avatars.length - 2}</span> : null}
										</span>
										<span className="min-w-0 truncate text-settings-label">{option.label}</span>
									</>
								);
							}}
						/>
						{hostId ? <span className="text-settings-muted">· {labelForHost(hostId) ?? hostId}</span> : null}
					</Dialog.Title>
					<Dialog.Description className="sr-only">
						{t(selectedProjectId === STANDALONE_WORKSPACE_ID ? "newTask.standaloneDescription" : "newTask.description")}
					</Dialog.Description>
					<TaskComposer
						projectId={selectedProjectId}
						hostId={hostId}
						createLabel={t("newTask.create")}
						autoFocusTitle
						onCreated={(sessionId) => {
							onCreated(sessionId);
							onOpenChange(false);
						}}
					/>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
