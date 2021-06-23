import Workspace from "./Workspace";
declare class Project {
    cwd: string;
    workspacesByCwd: Map<string, Workspace>;
    constructor(cwd: string);
    setupProject(): void;
    setupWorkspaces(): void;
    addWorkspace(cwd: string): Workspace | undefined;
}
export default Project;
//# sourceMappingURL=Project.d.ts.map