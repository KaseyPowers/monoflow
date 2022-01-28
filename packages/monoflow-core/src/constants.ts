
export const packageFileName = "package.json" as const;

export const dependencyKeys = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
] as const;

export const monoFlowConfigOptions = {
    packageKey: "monoflow",
    checkPath: "monoflow.config.{js,json,yml,yaml}"
}