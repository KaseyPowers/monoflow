
import { dependencyKeys } from "./constants";
import Context from "./Context";
import BaseLogger from "./BaseLogger";
import { TaskConfig } from "./tasks";

export type DependencyKeys = typeof dependencyKeys[number];

export type DependencyObjects = {
    [K in DependencyKeys]?: {
        [key: string]: string;
    }
};

export interface Package extends DependencyObjects {
    name: string;
    workspaces?: string[];
    [key: string]: any;
}

// the bare minimum needed for each workspace to build from
export interface InitialWorkspace {
    cwd: string; // the workspace path
    name?: string; // the name of the workspace
    package: Package;
    // will require one of these (if there are children)
    workspaceCwds?: string[]; // store the child paths
    workspaceNames?: string[]; // store the found child names
};

// the type definition for workspace building config
export type WorkspaceBuilderFn = (context: Context) => InitialWorkspace[];

export interface BasePlugin {
    id: string;
    tasks: TaskConfig | TaskConfig[],
    // define any dependent plugins to make sure they are included
    plugins?: PluginInputType[]
}

export type PluginInputType = string | BasePlugin;

export interface InputMonoflowConfig {
    cwd?: string;
    workspaceLoader: string | WorkspaceBuilderFn,
    logger: string | [string, object] | BaseLogger,
    plugins: PluginInputType[]
    // TODO: shared settings for all commands/etc.
};

export interface Command {
    id: string;
    // other command options like command arguments
}

export type CommandConfig = string | Command;
