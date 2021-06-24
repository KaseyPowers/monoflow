import getWorkspaces from "@monoflow/get-workspaces";

const {
    workspacesByCwd
} = getWorkspaces();

for (const workspace of workspacesByCwd.values()) {
    console.log(workspace.toString());
}