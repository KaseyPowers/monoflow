"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Workspace_1 = __importDefault(require("./Workspace"));
class Project {
    cwd; // the root path for the project
    workspacesByCwd;
    constructor(cwd) {
        this.cwd = path_1.default.normalize(cwd);
        this.workspacesByCwd = new Map();
        if (!Workspace_1.default.validWorkspaceDir(cwd)) {
            throw new Error(`The cwd provided isn't a valid workspace: ${this.cwd}`);
        }
        this.setupProject();
    }
    // search through the parent directories hoping to find the root project
    setupProject() {
        const initialCwd = this.cwd;
        let current = initialCwd;
        let previous;
        do {
            if (Workspace_1.default.validWorkspaceDir(current)) {
                const workspace = new Workspace_1.default(current);
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
            current = path_1.default.dirname(current);
        } while (current !== previous);
    }
    // iterate over workspaces, adding any child ones until we've found them all
    setupWorkspaces() {
        let testPaths = new Set();
        // build the paths from the current data
        for (const workspace of this.workspacesByCwd.values()) {
            for (const childCwd of workspace.workspaceCwds) {
                testPaths.add(childCwd);
            }
        }
        // iterate while there are paths to test
        while (testPaths.size > 0) {
            // first save the current test paths and clear the testPaths array
            const paths = new Set([...testPaths]);
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
                    workspace.workspaceCwds.forEach(childCwd => testPaths.add(childCwd));
                }
            }
        }
    }
    addWorkspace(cwd) {
        // get the workspace if not already added and if a valid directory
        if (!this.workspacesByCwd.has(cwd) && Workspace_1.default.validWorkspaceDir(cwd)) {
            const workspace = new Workspace_1.default(cwd);
            this.workspacesByCwd.set(cwd, workspace);
            return workspace;
        }
    }
}
exports.default = Project;
//# sourceMappingURL=Project.js.map