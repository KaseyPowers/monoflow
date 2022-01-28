import path from "path";

import { WorkspaceBuilderFn, InputMonoflowConfig, BasePlugin, PluginInputType, Command } from "./types";

import { packageFileName, monoFlowConfigOptions } from "./constants";

import Context from "./Context";

import { Task } from "./tasks";

import Workspace from "./Workspace";

import { buildTasks, getCommands, mergeCommands } from "./utils";

// TODO: figure out how to cache stuff if possible to save time re-building this every time if there are no changes

type initialConfigInput = undefined | string | InputMonoflowConfig;
// master config for everything (plugins can have their own config for non-shared stuff?)
class MonoFlow {

    // the shared context that will be passed around for plugins and such
    context = new Context();

    constructor(input: initialConfigInput) {
        const { workspaceLoader, logger, plugins, ...rest } = this.getInitialConfig(input);

        // anything in the config that's not an expected value, 
        Object.assign(this.context, rest);

        if (!this.context.cwd) {
            throw new Error("a root was not defined in the initial config");
        }

        if (logger) {
            this.context.logger = (typeof logger === "string") ? require(logger) : logger;
        }

        this.loadWorkspaces(workspaceLoader);

        this.processPlugins(plugins);
    }

    getInitialConfig(input: initialConfigInput) {
        // get the initial config from the input or try to find it searching up the tree
        let useRoot: undefined | string;
        let warnRoot: boolean = true;
        let initialConfig: undefined | InputMonoflowConfig;

        if (input) {
            if (typeof input === "string") {
                const stats = this.context.helpers.file.fileStats(input);
                // if stats not found, the string isn't a valid path
                if (stats) {
                    // if the input is a string path, turn off warning about useRoot since we can let them configure elsewhere. ( ex. <root>/monoflowConfig/index.js)
                    warnRoot = false;
                    if (stats.isDirectory()) { // if a directory, use it as the search location
                        useRoot = input;

                    } else if (input.endsWith(packageFileName)) {
                        // if the input is the path of a package.json, use it's directory for the root since we check for package.json first in the readConfig logic
                        useRoot = path.dirname(input);
                    } else {
                        // if pointing to a specific file, attempt reading it
                        initialConfig = this.context.helpers.file.fileReader(input) as InputMonoflowConfig;
                        if (!initialConfig.cwd) {
                            initialConfig.cwd = path.dirname(input);
                        }
                    }
                } else {
                    throw new Error(`Input string is not a valid path: ${input}`);
                }

                if (useRoot && !initialConfig) {
                    initialConfig = this.context.helpers.file.readConfig({
                        cwd: useRoot,
                        ...monoFlowConfigOptions
                    }) as InputMonoflowConfig;
                }
            } else {
                // if not a string, must be an Input Config
                initialConfig = input;
            }
        } else {
            // no input, try to find the root manually
            let initialCwd: string = path.normalize(process.cwd());

            // search up the path for any potential workspaces, adding them to pending (with initial path as only valid) 
            let current = initialCwd;
            let previous: string = ""; // initial empty value to pass while loop
            while (current !== previous && !initialConfig) {
                // at each level, check if the directory can be a root of the worktree
                if (this.context.helpers.file.dirHasPackage(current)) {
                    // get the config at this level if it's defined
                    initialConfig = this.context.helpers.file.readConfig({
                        cwd: current,
                        ...monoFlowConfigOptions
                    });
                    if (initialConfig) {
                        useRoot = current;
                    }
                }
                previous = current;
                current = path.dirname(current);
            }
        }

        // make sure config found
        if (!initialConfig) {
            throw new Error("No configuration found");
        }

        // if useRoot, make sure initialConfig has a cwd
        if (useRoot) {
            if (!initialConfig.cwd) {
                initialConfig.cwd = useRoot;
            } else if (warnRoot && initialConfig.cwd && useRoot !== initialConfig.cwd) {
                console.warn(`useRoot does not match the config: root (${useRoot}) - config.cwd (${initialConfig.cwd})`);
            }
        }

        return initialConfig;
    }

    loadWorkspaces(loader: string | WorkspaceBuilderFn) {
        const useLoader: WorkspaceBuilderFn = typeof loader === "string" ? require(loader) : loader;

        // first load in the initial workspaces
        const response = useLoader(this.context);

        response.forEach(initialWorkspace => {
            const useWorkspace = new Workspace(initialWorkspace);
            this.context.workspaces.set(useWorkspace.name, useWorkspace);
        });

        // aftera all are added, run the check against the full map
        for (const workspace of this.context.workspaces.values()) {
            workspace.checkChildWorkspaces(this.context.workspaces);
        }
    }

    // store the monoflow plugins
    plugins: Map<string, BasePlugin> = new Map();
    private pluginRequireChecks: Set<string> = new Set();

    private loadPlugins(inputPlugins: PluginInputType[]) {
        inputPlugins.forEach((inputPlugin) => {
            let usePlugin: BasePlugin;
            if (typeof inputPlugin === "string") {
                if (this.pluginRequireChecks.has(inputPlugin)) {
                    // skip this one (TODO: confirm return here skips it as expected)
                    return;
                }
                usePlugin = require(inputPlugin);
                this.pluginRequireChecks.add(inputPlugin);
            } else {
                usePlugin = inputPlugin;
            }
            // make sure the plugin hasn't been added already
            if (!this.plugins.has(usePlugin.id)) {
                this.plugins.set(usePlugin.id, usePlugin);
                if (usePlugin.plugins) {
                    this.loadPlugins(usePlugin.plugins);
                }
            }
        });
    }

    // store the tasks, each one using the plugin's id + task-id
    tasks: Map<string, Task> = new Map();
    commands: Map<string, Command> = new Map();

    processPlugins(inputPlugins: PluginInputType[]) {
        // load the input plugins
        this.loadPlugins(inputPlugins);

        // TODO
        // apply plugin modifiers to workspaces
        // this.plugins.forEach(plugin => {

        // })

        // add tasks from plugins
        this.plugins.forEach(plugin => {
            // add the tasks to the global map of tasks
            const tasks = buildTasks(plugin.tasks);
            tasks.forEach(task => {
                this.tasks.set([plugin.id, task.id].join("."), task);
            });
        });

        // TODO: get commands from tasks
        for (const task of this.tasks.values()) {
            if (task.command) {
                getCommands(task.command).forEach(command => {
                    const existingCommand = this.commands.get(command.id);
                    this.commands.set(command.id, existingCommand ? mergeCommands(existingCommand, command) : command)
                });
            }
        }
    }
}

export default MonoFlow;