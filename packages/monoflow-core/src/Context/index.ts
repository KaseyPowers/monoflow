import FileHelpers from "./FileHelpers";

import BaseLogger from "../BaseLogger";

import Workspace from "../Workspace";

class Context {

    cwd: string = "";
    helpers = {
        file: new FileHelpers(this)
    }
    logger?: BaseLogger;

    // store all the workspces and their configurations
    workspaces: Map<string, Workspace> = new Map();

    [key: string]: any;
}

export default Context;