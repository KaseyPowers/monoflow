"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getChildPackages_1 = __importDefault(require("./getChildPackages"));
async function getWorkTree() {
    const loc = process.cwd();
    const patterns = [
        "packages/*",
        "packages/testFolder2/testFolder2.1"
    ];
    const results = await getChildPackages_1.default(loc, patterns);
    console.log(results);
}
getWorkTree();
//# sourceMappingURL=getWorkTree.js.map