import { WorkspaceFilterFn } from "./Workspace";
import { CommandConfig } from "./types";

type TaskRunFn = () => void;
type AsyncTaskRunFn = () => Promise<void>;

interface BaseTask {
    // must be unique (might prepend with plugin id? )
    id?: string,
    // thing to run for function
    run?: TaskRunFn,
    // async/promise version of run function
    runAsync?: AsyncTaskRunFn,
    // could also allow functions here?
    pre?: string | string[],
    post?: string | string[],
    // filter to apply against workspaces to get the ones these tasks are valid on
    workspaceFilter?: WorkspaceFilterFn,
    // optional filter to run after regular one to limit options for the command (ex. start )
    workspaceCommandFilter?: WorkspaceFilterFn,

    command?: CommandConfig | CommandConfig[];
};

export interface TaskConfig extends BaseTask {
    tasks?: TaskConfig | TaskConfig[]
}

export interface Task extends BaseTask {
    id: string,
}
