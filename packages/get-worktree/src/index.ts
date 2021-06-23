import Project from "./Project";

const cwd = process.cwd();
console.log(`Starting cwd: ${cwd}`);

const project = new Project(cwd);

console.log("root: ", cwd);
const rootWorkspace = project.workspacesByCwd.get(project.cwd);

console.log("root workspace children");
if (rootWorkspace) {
    for (const cwd of rootWorkspace?.workspaceCwds) {
        console.log(cwd);
    }
}