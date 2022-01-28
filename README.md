# monoflow

a workflow utility for monorepos using yarn workspaces.

Each project reads in the config from package.json + a main file [monoflowrc or monofolow.config].(js|ts|yml|json)

NOTE:
have the project config merge logic just be based on directory instead of trying to figure out proper tree traversing logic

NOTES:
determine config style for project configs vs config the tool

classes/structures

Core - main thing
collects the workflow, adds plugins, and using those runs commands/tasks/etc

- Command: a collection of tasks
- Task: the steps that make up a command

Plugin:

- will add/confirm commands
- add tasks
- add configuration logic

Runner/Logger/etc. - Ways to modularly define how we display output/results/etc.
