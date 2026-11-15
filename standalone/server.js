/**
 * Entry used when Hostinger's output directory is empty and it starts standalone/server.js.
 */
const path = require("path");

const directory = path.join(__dirname, "..", ".next", "standalone");
process.chdir(directory);
require(path.join(directory, "server.js"));
