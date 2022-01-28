import { InitialWorkspace, Package } from "./types";

class Workspace {
    // the path to the workspace
    cwd: string;
    name: string;

    // // store the shema used to validate the package
    // packageSchema = Joi.object({
    //     name: Joi.string().required(),
    //     workspaces: Joi.array().items(Joi.string())
    // });
    // TODO: figure out how to type this based on the pacakge shcema but still let it be extended?
    package: Package;

    childWorkspaces: false | {
        cwds?: string[],
        names?: string[]
    };

    constructor(initial: InitialWorkspace) {
        // the two garunteed values from initial
        this.cwd = initial.cwd;
        this.package = initial.package;

        this.name = initial.name || this.package.name;

        // initialize child workspaces logic
        this.childWorkspaces = false;
        const { workspaceCwds, workspaceNames } = initial;
        const useCwds: false | string[] = Array.isArray(workspaceCwds) && workspaceCwds.length > 0 && workspaceCwds;
        const useNames: false | string[] = Array.isArray(workspaceNames) && workspaceNames.length > 0 && workspaceNames;
        if (useCwds || useNames) {
            // if both exists, but have different lengths, something off
            if (useCwds && useNames && useCwds.length !== useNames.length) {
                throw new Error("Both cwds and names are provided, but have different lengths");
            }

            this.childWorkspaces = {};
            if (useCwds) {
                this.childWorkspaces.cwds = useCwds;
            }
            if (useNames) {
                this.childWorkspaces.names = useNames;
            }
        }
        // NOTE: what to do with other initial values if provided?
    }

    // make sure that if child workspaces are defined, that the 
    checkChildWorkspaces(allWorkspacesByName: Map<string, Workspace>) {
        // return early if no child workspaces
        if (!this.childWorkspaces) {
            return;
        }
        const { cwds, names } = this.childWorkspaces;
        // first check the cwds that they are valid, and build useNames if not defined
        if (cwds) {
            const cwdsToFind = new Set([...cwds]);
            const namesFromCwds: Set<string> = new Set();
            for (const workspace of allWorkspacesByName.values()) {
                if (cwdsToFind.has(workspace.cwd)) {
                    if (namesFromCwds.has(workspace.name)) {
                        throw new Error(`found workspace for ${workspace.cwd} but already had a workspace for name ${workspace.name}`);
                    }
                    namesFromCwds.add(workspace.name);
                    cwdsToFind.delete(workspace.cwd);
                }
            }
            // if any cwds not found, throw an error
            if (cwdsToFind.size > 0) {
                throw new Error(`Not all cwds defined were found in the provided workspaces\nchild cwds: [${cwds.toString()}], all cwds provided [${[...allWorkspacesByName.values()].map(workspace => workspace.name)}]`);
            }
            if (names) {
                if (names.length !== namesFromCwds.size) {
                    throw new Error("Child workspace names is not the same size as the names found from cwds");
                }
                names.forEach(name => {
                    if (!namesFromCwds.has(name)) {
                        throw new Error(`${name} not found in workspaces defined by cwd`)
                    }
                });
            } else {
                // setting names here, but could assign to names to have the reverse checked out but that seems redundant?
                this.childWorkspaces.names = [...namesFromCwds];
            }
        }

        if (names) {
            const cwdsFromName: Set<string> = new Set();
            names.forEach(name => {
                const workspace = allWorkspacesByName.get(name);
                if (workspace) {
                    const cwd = workspace.cwd;
                    if (cwdsFromName.has(cwd)) {
                        throw new Error(`found workspace for ${name} but already had a workspace for cwd ${workspace.cwd}`);
                    }
                    cwdsFromName.add(workspace.cwd);
                } else {
                    throw new Error(`No workspace found for name: ${name}`);
                }
            });

            if (cwds) {
                if (cwds.length !== cwdsFromName.size) {
                    throw new Error("Child workspace cwds is not the same size as the cwds found from names");
                }
                cwds.forEach(cwd => {
                    if (!cwdsFromName.has(cwd)) {
                        throw new Error(`${cwd} not found in workspaces defined by name`)
                    }
                });
            } else {
                this.childWorkspaces.cwds = [...cwdsFromName];
            }
        }
    }
}

export type WorkspaceFilterFn = (value: Workspace) => boolean;

export default Workspace;