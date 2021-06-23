import path from 'path';

import Workspace from "./Workspace";

class Project {
    cwd: string; // the root path for the project
    workspacesByCwd: Map<string, Workspace>;

    constructor(cwd: string) {
        this.cwd = path.normalize(cwd);
        this.workspacesByCwd = new Map();
        if (!Workspace.validWorkspaceDir(cwd)) {
            throw new Error(`The cwd provided isn't a valid workspace: ${this.cwd}`)
        }
        this.setupProject();
    }

    // search through the parent directories hoping to find the root project
    setupProject() {
        const initialCwd = this.cwd;
        let current = initialCwd;
        let previous: string;

        do {
            if (Workspace.validWorkspaceDir(current)) {
                const workspace = new Workspace(current);
                // check if valid, true if root cwd, or if it's child workspaces overlap the paths found so far
                if (current === initialCwd || [...workspace.workspaceCwds].some(childCwd => this.workspacesByCwd.has(childCwd))) {
                    // if valid, updating the cwd
                    if (current !== initialCwd) {
                        this.cwd = current;
                    }
                    // add workspace, NOTE: keep in sync with the addWorkspace function if that gets more complicated
                    this.workspacesByCwd.set(current, workspace);
                    // check the workspace tree after adding the new one
                    this.setupWorkspaces();
                }
            }

            previous = current;
            current = path.dirname(current);
        } while (current !== previous);
    }

    // iterate over workspaces, adding any child ones until we've found them all
    setupWorkspaces() {
        let testPaths: Set<string> = new Set();

        // build the paths from the current data
        for (const workspace of this.workspacesByCwd.values()) {
            for (const childCwd of workspace.workspaceCwds) {
                testPaths.add(childCwd);
            }
        }

        // iterate while there are paths to test
        while (testPaths.size > 0) {
            // first save the current test paths and clear the testPaths array
            const paths: Set<string> = new Set([...testPaths]);
            testPaths.clear();

            for (const cwd of paths) {
                // if the cwd has been added already, skip
                if (this.workspacesByCwd.has(cwd)) {
                    continue;
                }
                // add the new workspace
                const workspace = this.addWorkspace(cwd);
                // add the child workspaces to the testPath set
                if (workspace) {
                    workspace.workspaceCwds.forEach(childCwd => testPaths.add(childCwd))
                }
            }
        }
    }

    addWorkspace(cwd: string) {
        // get the workspace if not already added and if a valid directory
        if (!this.workspacesByCwd.has(cwd) && Workspace.validWorkspaceDir(cwd)) {
            const workspace = new Workspace(cwd);
            this.workspacesByCwd.set(cwd, workspace);
            return workspace;
        }
    }
}

export default Project;