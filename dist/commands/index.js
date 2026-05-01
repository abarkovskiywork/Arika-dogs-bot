"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = registerCommands;
const myid_1 = require("./myid");
const addServiceEvent_1 = require("./addServiceEvent");
const start_1 = require("./start");
const commands = [
    myid_1.registerMyIdCommand,
    addServiceEvent_1.registerAddServiceCommand,
    start_1.registerStartCommand
];
function registerCommands(bot) {
    for (const register of commands) {
        register(bot);
    }
}
