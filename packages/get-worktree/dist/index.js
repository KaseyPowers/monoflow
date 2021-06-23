"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Project_1 = __importDefault(require("./Project"));
const cwd = process.cwd();
console.log(`Starting cwd: ${cwd}`);
const project = new Project_1.default(cwd);
console.log("root: ", cwd);
const rootWorkspace = project.workspacesByCwd.get(project.cwd);
console.log("root workspace children");
if (rootWorkspace) {
    for (const cwd of rootWorkspace?.workspaceCwds) {
        console.log(cwd);
    }
}
//# sourceMappingURL=index.js.map