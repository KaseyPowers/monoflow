import path from 'path';
import fs from 'fs';
import globby from "globby";

// minimum package needed for this logic
interface Package {
    name: string;
    workspaces?: string[];
};

/*
    terminology:
    - project: the root container for all the workspaces
    - workspace: named package inside the project/worktree
    - worktree: the tree of workspaces
*/


const fileName = "package.json";
class Workspace {
    cwd: string; // path to workspace
    package: Package; // store the read package, so we don't need to re-read it later

    workspaceCwds: Set<string>; // to store the found child paths

    static validWorkspaceDir(dir: string) {
        return fs.existsSync(path.join(dir, fileName));
    }

    constructor(cwd: string) {
        this.cwd = cwd;
        if (!Workspace.validWorkspaceDir(cwd)) {
            throw new Error(`Workspace constructed with invalid cwd location: ${cwd}`);
        }
        this.package = JSON.parse(fs.readFileSync(path.join(cwd, fileName), 'utf8'));
        this.workspaceCwds = new Set();
        this.checkWorkspaces();
    }

    checkWorkspaces() {
        if (!this.package.workspaces) {
            return;
        }
        // TODO: performance test if it's worth splitting off the non-magic paths to check without globby?
        const patterns = this.package.workspaces || [];
        // using the same options that yarn uses
        const foundPaths = globby.sync(patterns, {
            absolute: true,
            cwd: this.cwd,
            expandDirectories: false,
            onlyDirectories: true,
            onlyFiles: false,
            ignore: [`**/node_modules`, `**/.git`, `**/.yarn`],
        });
        // sorting becuase why not, based this off yarn logic
        foundPaths.sort();

        foundPaths.forEach(loc => {
            if (Workspace.validWorkspaceDir(loc)) {
                this.workspaceCwds.add(loc);
            }
        });
    }
}

export default Workspace;