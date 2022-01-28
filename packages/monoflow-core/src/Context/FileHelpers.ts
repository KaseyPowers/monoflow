import path from "path";
import fs from 'fs';
import globby from "globby";
import YAML from 'yaml'

import type { Package } from "../types";
import { packageFileName } from "../constants";

type ResolveUpOptions = { pattern: string | string[], startCwd: string, endCwd?: string, defaultPath?: string };

class FileHelpers {
    // basic path helpers
    fileExists(checkFile: string): string | false {
        return fs.existsSync(checkFile) && checkFile;
    };

    fileStats(checkFile: string): fs.Stats | false {
        return !!this.fileExists(checkFile) && fs.statSync(checkFile);
    }

    findFiles(pattern: string | string[], dir: string): string[] {
        return globby.sync(pattern, {
            absolute: true,
            cwd: dir,
            expandDirectories: false,
            onlyFiles: true,
            ignore: [`**/node_modules`, `**/.git`, `**/.yarn`]
        });
    }

    resolveUp({ pattern, startCwd, endCwd, defaultPath }: ResolveUpOptions): string[] | false {
        const useEndCwd = endCwd || this.context.cwd;
        // make sure endCwd is a parent of startCwd otherwise will end up in awkard loop
        if (!startCwd.startsWith(useEndCwd)) {
            throw new Error(`Starting directory for search (${startCwd}) should have the end directory as a parent (${useEndCwd})`);
        }
        let foundPaths: string[] | false = false;

        let current = startCwd;
        let previous = "";

        while (current !== previous && !foundPaths && previous !== useEndCwd) {
            const checkFound = this.findFiles(pattern, current);
            // only set the foundPaths if there was any values in the response
            if (checkFound.length > 0) {
                foundPaths = checkFound;
            }

            previous = current;
            current = path.dirname(current);
        }

        if (!foundPaths && defaultPath) {
            const checkFound = this.findFiles(pattern, defaultPath);
            if (checkFound.length > 0) {
                foundPaths = checkFound;
            }
        }
        return foundPaths;
    }

    // stuff for reading in files

    // just get the test, to parse
    private readFile(filePath: string): string {
        return fs.readFileSync(filePath, 'utf8');
    }

    private fileReaderMap: Map<RegExp, (filePath: string) => any> = new Map();

    addReader(regex: RegExp, readerFn: (filePath: string) => any) {
        this.fileReaderMap.set(regex, readerFn);
    }

    addParser(regex: RegExp, parserFn: (fileData: string) => any) {
        const readerFn = (filePath: string) => parserFn(this.readFile(filePath));
        this.fileReaderMap.set(regex, readerFn);
    }

    // assuming Json won't chage from this
    readJson(filePath: string) {
        return JSON.parse(this.readFile(filePath));
    }

    // special packages logic
    packagesByCwd: Map<string, Package> = new Map();
    private checkedCwds: Map<string, boolean> = new Map();

    private usePackagePath(cwd: string): string {
        return cwd.endsWith(packageFileName) ? cwd : path.join(cwd, packageFileName);
    }

    dirHasPackage(cwd: string): boolean {
        const usePath = this.usePackagePath(cwd);

        // if hasn't checked, set value
        if (!this.checkedCwds.has(usePath)) {
            this.checkedCwds.set(usePath, !!this.fileExists(usePath));
        }
        // casting as boolean because it should always be found (because of the check above)
        return this.checkedCwds.get(cwd) as boolean;
    }

    getPackage(cwd: string): Package | false {
        const usePath = this.usePackagePath(cwd);
        // make sure the package exists
        if (!this.dirHasPackage(usePath)) {
            return false;
        }
        // if not read in yet, fetch it
        if (!this.packagesByCwd.has(usePath)) {
            this.packagesByCwd.set(usePath, this.readJson(usePath));
        }
        return this.packagesByCwd.get(usePath) as Package;
    }

    fileReader(filePath: string): any {
        // first check if package.json for special logic
        if (filePath.endsWith(packageFileName)) {
            return this.getPackage(filePath);
        }
        // then check regular json since that is constant
        if (/\.json$/.test(filePath)) {
            return this.readJson(filePath);
        }
        // lastly check all the added readers 
        for (const [regex, reader] of this.fileReaderMap) {
            if (regex.test(filePath)) {
                return reader(filePath);
            }
        }

        // if still here, use require as fallback
        if (/\.(js|cjs|mjs)$/.test(filePath)) {
            return require(filePath);
        }
        throw new Error(`No reader defined for this file type: ${filePath}`)
    }

    constructor(private context: { cwd: string }) {
        // add yaml parser to the map
        this.addParser(/\.ya?ml$/, (data: string) => YAML.parse(data));
    }

    readConfig({
        cwd,
        packageKey,
        checkPath
    }: {
        cwd: string; // directory to search in
        packageKey?: boolean | string; // if the directory has a package.json check for this key as the config
        checkPath?: string | string[]; // the name to search for (technically a glob pattern)
    }) {
        // if packageKey is truthy, check first if the package exists
        if (packageKey) {
            const pkg = this.getPackage(cwd);
            if (!pkg) {
                return false;
            }
            // if the packageKey is a string, check for it in pkg
            if (typeof packageKey === "string" && pkg[packageKey]) {
                return pkg[packageKey];
            }
        }

        // if we haven't returned yet, use checkPath to look for manual files
        if (checkPath) {
            // just use the first file found, can iterate on this logic as we know more
            const files = this.findFiles(checkPath, cwd);
            // make sure files are returned
            if (files.length > 0) {
                // just return the first file found
                if (files.length > 1) {
                    throw new Error("Multiple files matched the checkPath(s) given");
                }
                if (files[0]) {
                    return this.fileReader(files[0]);
                }
            }
        }
    }
}

export default FileHelpers;