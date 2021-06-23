"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const globby_1 = __importDefault(require("globby"));
;
/*
    terminology:
    - project: the root container for all the workspaces
    - workspace: named package inside the project/worktree
    - worktree: the tree of workspaces
*/
const fileName = "package.json";
class Workspace {
    cwd; // path to workspace
    package; // store the read package, so we don't need to re-read it later
    workspaceCwds; // to store the found child paths
    static validWorkspaceDir(dir) {
        return fs_1.default.existsSync(path_1.default.join(dir, fileName));
    }
    constructor(cwd) {
        this.cwd = cwd;
        if (!Workspace.validWorkspaceDir(cwd)) {
            throw new Error(`Workspace constructed with invalid cwd location: ${cwd}`);
        }
        this.package = JSON.parse(fs_1.default.readFileSync(path_1.default.join(cwd, fileName), 'utf8'));
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
        const foundPaths = globby_1.default.sync(patterns, {
            absolute: true,
            cwd: this.cwd,
            expandDirectories: false,
            onlyDirectories: true,
            onlyFiles: false,
            ignore: [`**/node_modules`, `**/.git`, `**/.yarn`],
        });
        console.log(`Found: ${foundPaths.join(",\n")}`);
        // sorting becuase why not, based this off yarn logic
        foundPaths.sort();
        console.log(`Found sorted: ${foundPaths.join(",\n")}`);
        foundPaths.forEach(loc => {
            if (Workspace.validWorkspaceDir(loc)) {
                this.workspaceCwds.add(loc);
            }
        });
    }
}
exports.default = Workspace;
//# sourceMappingURL=Workspace.js.map