# monoflow

a workflow utility for monorepos using yarn workspaces.

Each project reads in the config from package.json + a main file [monoflowrc or monofolow.config].(js|ts|yml|json)

NOTES:
determine config style for project configs vs config the tool

classes/structures

Core - main thing

Command, Task, Job?

- Need to figure out how to modularly define things like big commands (build/start/test)
- As well as the stuff that makes up those commands (webpack/jest/etc.)

Runner/Logger/etc. - Ways to modularly define how we display output/results/etc.
