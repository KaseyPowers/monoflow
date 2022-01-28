import path from 'path';

import Workspace from "./Workspace";

export default function getWorkspaces(intiailRoot: string = process.cwd()) {
    const initialCwd = path.normalize(intiailRoot);
    if (!Workspace.validWorkspaceDir(initialCwd)) {
        throw new Error(`The initialRoot provided isn't a valid workspace: ${intiailRoot} (Normalized ${initialCwd})`)
    }
    // store workspaces we've built that we aren't sure if part of the project, to avoid duplicate work if we find out they are valid later
    const pendingWorkspacesByCwd: Map<string, Workspace> = new Map();
    // store the valid workspaces by path and by name
    const workspacesByCwd: Map<string, Workspace> = new Map();
    const workspacesByName: Map<string, Workspace> = new Map();

    // add the workspace object, will throw errors if already exists
    function addWorkspace(toAdd: Workspace, isValid: boolean = true) {
        // check if already exists (don't add it to pending if it already exists in valid )
        if (workspacesByCwd.has(toAdd.cwd)) {
            throw new Error(`Trying to add a workspace (at this path) twice.\nNew: ${toAdd}\nExisting: ${workspacesByCwd.get(toAdd.cwd)}`);
        }
        if (workspacesByName.has(toAdd.name)) {
            throw new Error(`Trying to add two workspaces with the same name.\nNew: ${toAdd}\nExisting: ${workspacesByCwd.get(toAdd.cwd)}`);
        }
        // adding valid workspace (vs. maybe)
        if (isValid) {
            // check if this is being moved from pending to valid
            if (pendingWorkspacesByCwd.has(toAdd.cwd)) {
                pendingWorkspacesByCwd.delete(toAdd.cwd);
            }
            workspacesByCwd.set(toAdd.cwd, toAdd);
            workspacesByName.set(toAdd.name, toAdd);
        } else {
            // if adding to pending, check if it already exists in pending 
            if (pendingWorkspacesByCwd.has(toAdd.cwd)) {
                throw new Error(`Trying to add a workspace (at this path) twice.\nNew: ${toAdd}\nExisting: ${pendingWorkspacesByCwd.get(toAdd.cwd)}`);
            }
            pendingWorkspacesByCwd.set(toAdd.cwd, toAdd);
        }
    }

    // search up the path for any potential workspaces, adding them to pending (with initial path as only valid) 
    let current = initialCwd;
    let previous: string;
    do {
        // at each level, check if the directory can be a root of the worktree
        if (Workspace.validWorkspaceDir(current)) {
            const workspace = new Workspace(current);
            // if current is at the starting path, add as valid. Otherwise add to pending and let the workspaces logic flush it out
            addWorkspace(workspace, current === initialCwd);
        }
        previous = current;
        current = path.dirname(current);
    } while (current !== previous)


    // try adding a workspace path, will gracefully return early if the path already exists or isn't a valid path
    function addWorkspaceByCwd(cwd: string, isValid: boolean = true): false | Workspace {
        // if already added, end here
        if (workspacesByCwd.has(cwd) || (!isValid && pendingWorkspacesByCwd.has(cwd))) {
            return false;
        }
        let toAdd: false | Workspace = false;
        // if valid and already added to pending, use the existing
        if (isValid && pendingWorkspacesByCwd.has(cwd)) {
            toAdd = pendingWorkspacesByCwd.get(cwd) || false; // the or false is for typescript, get should always be defined here since we have checked `.has` already?
        }
        // if no workspace defined yet
        if (!toAdd && Workspace.validWorkspaceDir(cwd)) {
            toAdd = new Workspace(cwd);
        }
        // add workspace to maps if found
        if (toAdd) {
            addWorkspace(toAdd, isValid);
        }
        return toAdd;
    }


    // flush out all the workspaces by iterating over the valid and pending workspaces until no changes are left to make
    let changes = true;

    while (changes) {
        // reset these values
        changes = false;

        // check adding valid workspaces by iterating over all workspaces children and attempting to add
        // any pending workspaces will be moved over automatically in this process
        for (const workspace of workspacesByCwd.values()) {
            if (workspace.workspaceCwds) {
                for (const childCwd of workspace.workspaceCwds) {
                    changes = !!addWorkspaceByCwd(childCwd, true);
                }
            }
        }

        // only try adding invalid projects if no new valid ones were found
        if (!changes) {
            // iterate over pending workspaces
            for (const pendingWorkspace of pendingWorkspacesByCwd.values()) {
                if (pendingWorkspace.workspaceCwds) {
                    // if one of the children is a valid workspace, make this one valid
                    if (pendingWorkspace.workspaceCwds.some(childCwd => workspacesByCwd.has(childCwd))) {
                        addWorkspace(pendingWorkspace, true);
                        changes = true;
                    } else {
                        // otherwise add child pending spaces to see if they end up overlapping with valid
                        for (const childCwd of pendingWorkspace.workspaceCwds) {
                            changes = !!addWorkspaceByCwd(childCwd, false);
                        }
                    }
                }
            }
        }
    }

    // add names to workspaces for convenience:
    for (const workspace of workspacesByCwd.values()) {
        workspace.addNames(workspacesByCwd);
    }


    // iterate valid workspaces to find the root path
    // assuming root is the shortest path. 
    let root = [...workspacesByCwd.keys()].reduce((a, b) => a.length < b.length ? a : b, initialCwd);


    return {
        root,
        workspacesByCwd,
        workspacesByName
    };
}