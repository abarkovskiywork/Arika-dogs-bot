"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const googleapis_1 = require("googleapis");
const local_auth_1 = require("@google-cloud/local-auth");
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const CREDENTIALS_PATH = path_1.default.join(process.cwd(), "google-credentials.json");
const TOKEN_PATH = path_1.default.join(process.cwd(), "google-token.json");
async function loadSavedCredentialsIfExist() {
    try {
        const content = await promises_1.default.readFile(TOKEN_PATH, "utf-8");
        const credentials = JSON.parse(content);
        return googleapis_1.google.auth.fromJSON(credentials);
    }
    catch {
        return null;
    }
}
async function saveCredentials(client) {
    const content = await promises_1.default.readFile(CREDENTIALS_PATH, "utf-8");
    const keys = JSON.parse(content);
    const key = keys.installed ?? keys.web;
    if (!key) {
        throw new Error("Invalid google-credentials.json: no installed/web client");
    }
    if (!client.credentials.refresh_token) {
        throw new Error("No refresh token found in OAuth client");
    }
    const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    }, null, 2);
    await promises_1.default.writeFile(TOKEN_PATH, payload);
}
async function authorize() {
    const savedClient = await loadSavedCredentialsIfExist();
    if (savedClient) {
        return savedClient;
    }
    const client = await (0, local_auth_1.authenticate)({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials.refresh_token) {
        await saveCredentials(client);
    }
    return client;
}
