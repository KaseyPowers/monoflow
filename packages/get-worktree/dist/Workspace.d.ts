interface Package {
    name: string;
    workspaces?: string[];
}
declare class Workspace {
    cwd: string;
    package: Package;
    workspaceCwds: Set<string>;
    static validWorkspaceDir(dir: string): boolean;
    constructor(cwd: string);
    checkWorkspaces(): void;
}
export default Workspace;
//# sourceMappingURL=Workspace.d.ts.map