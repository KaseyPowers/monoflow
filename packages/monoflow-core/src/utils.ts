import { TaskConfig, Task } from "./tasks";
import { Command, CommandConfig } from "./types";

export function getCommands(value: CommandConfig | CommandConfig[]): Command[] {
    return (Array.isArray(value) ? value : [value]).map(childValue => {
        const output: Command = typeof childValue === "string" ? { id: childValue } : childValue;
        return output;
    });
}

export function mergeCommands(a: Command, b: Command): Command {
    // confirm that both commands use the same id
    if (a.id !== b.id) {
        throw new Error("Can't merge two commands with different ids");
    }

    // TODO: rest of merge logic

    return {
        ...a,
        ...b
    };
}

export function mergeCommandConfigs(a: CommandConfig | CommandConfig[], b: CommandConfig | CommandConfig[]): Command[] {
    const output: Command[] = [];

    getCommands(a).forEach(aCommand => {
        output.push(aCommand);
    });

    getCommands(b).forEach(bCommand => {
        let found: boolean = false;
        for (let i = 0; i < output.length && !found; i += 1) {
            const existing = output[i];
            // if found, merge the two commands
            if (existing && existing.id === bCommand.id) {
                found = true;
                output[i] = mergeCommands(existing, bCommand);
            }
        }

        // if existing not found, add to the array
        if (!found) {
            output.push(bCommand);
        }
    });

    return output;
}

function tasksFromConfig(val: TaskConfig): Task[] {
    const output: Task[] = [];
    const { tasks, command: parentCommand, ...rest } = val;
    // if has child objects defined
    if (tasks) {
        const childTasks = Array.isArray(tasks) ? tasks : [tasks];
        childTasks.forEach(child => {
            tasksFromConfig(child).forEach(childTask => {
                const { command, ...childRest } = childTask;
                const useTask: Task = {
                    ...rest,
                    ...childRest
                };
                if (rest.id && childTask.id) {
                    useTask.id = [rest.id, childTask.id].join(".");
                }
                // add commands logic merging
                if (parentCommand && command) {
                    useTask.command = mergeCommandConfigs(parentCommand, command);
                } else if (parentCommand || command) {
                    useTask.command = command || parentCommand;
                }

                output.push(useTask);
            });
        });
    } else {
        // assigning as task, assuming that buildTask will filter out invalid ones
        output.push({
            ...rest
        } as Task);
    }

    return output;
}

export function buildTasks(input: TaskConfig | TaskConfig[]): Task[] {
    const configs = Array.isArray(input) ? input : [input];
    let output: Task[] = [];

    configs.forEach(config => {
        const tasks = tasksFromConfig(config);
        // validate tasks before adding
        tasks.forEach(task => {
            if (typeof task.id === "string" && !!task.id) {
                output.push(task as Task);
            }
        });
    });

    return output;
}