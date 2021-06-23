"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const globby_1 = __importDefault(require("globby"));
async function findWorkspaces(loc, patterns) {
    const foundPaths = await globby_1.default(patterns, {
        absolute: true,
        cwd: loc,
        expandDirectories: false,
        onlyDirectories: true,
        onlyFiles: false,
        ignore: [`**/node_modules`, `**/.git`, `**/.yarn`],
    });
    // sorting becuase why not, based this off yarn logic
    foundPaths.sort();
    // return only the directories that have a package.json inside
    return foundPaths.filter(loc => {
        return fs_1.default.existsSync(path_1.default.join(loc, "package.json"));
    });
}
exports.default = findWorkspaces;
//# sourceMappingURL=getChildPackages.js.map