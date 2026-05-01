import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import type { OAuth2Client } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const CREDENTIALS_PATH = path.join(process.cwd(), "google-credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "google-token.json");

type GoogleCredentialsFile = {
  installed?: {
    client_id: string;
    client_secret: string;
  };
  web?: {
    client_id: string;
    client_secret: string;
  };
};

async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    const content = await fs.readFile(TOKEN_PATH, "utf-8");
    const credentials = JSON.parse(content);

    return google.auth.fromJSON(credentials) as OAuth2Client;
  } catch {
    return null;
  }
}

async function saveCredentials(client: OAuth2Client): Promise<void> {
  const content = await fs.readFile(CREDENTIALS_PATH, "utf-8");
  const keys = JSON.parse(content) as GoogleCredentialsFile;
  const key = keys.installed ?? keys.web;

  if (!key) {
    throw new Error("Invalid google-credentials.json: no installed/web client");
  }

  if (!client.credentials.refresh_token) {
    throw new Error("No refresh token found in OAuth client");
  }

  const payload = JSON.stringify(
    {
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    },
    null,
    2
  );

  await fs.writeFile(TOKEN_PATH, payload);
}

export async function authorize(): Promise<OAuth2Client> {
  const savedClient = await loadSavedCredentialsIfExist();

  if (savedClient) {
    return savedClient;
  }

  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  if (client.credentials.refresh_token) {
    await saveCredentials(client);
  }

  return client;
}