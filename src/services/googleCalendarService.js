const fs = require("fs/promises");
const path = require("path");
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const CREDENTIALS_PATH = path.join(process.cwd(), "google-credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "google-token.json");

async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH, "utf-8");
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch {
        return null;
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH, "utf8");
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token
    });

    await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
    console.log("Try authorize");
    let client = await loadSavedCredentialsIfExist();
    console.log("Check existing client: ", client);
    if (client) return client;

    console.log("try auth");
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH
    });

    console.log("auth client: ", client);
    console.log("creds: ", client.credentials?.refresh_token);

    if (client.credentials?.refresh_token) {
        await saveCredentials(client);
    }

    return client;

}

async function createCalendarEvent({
    calendarId,
    summary,
    description,
    startDateTime,
    endDateTime,
    timeZone
}) {
    const auth = await authorize();
    console.log(" auth type: ", auth.constructor.name);
    console.log("creds: ", auth.credentials);
    const token = await auth.getAccessToken();
    console.log("access token: ", token);
    const calendar = google.calendar({ version: "v3", auth});

    const response = await calendar.events.insert({
        calendarId,
        requestBody: {
            summary,
            description,
            start: {
                dateTime: startDateTime,
                timeZone
            },
            end: {
                dateTime: endDateTime,
                timeZone
            },
        },
    });

    return response.data
}

async function createServiceEvent({
  calendarId,
  dogName,
  serviceType,
  price,
  walksPerDay,
  isAllDay,
  startDate,      // "2026-04-30"
  endDate,        // "2026-12-31"
  startTime,      // "09:00" если не all-day
  endTime,        // "10:00" если не all-day
  timezone = "Europe/Belgrade",
}) {
  const auth = await authorize();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: `${dogName}`,
    description: dogName=`${dogName}\nserviceType=${serviceType}\nprice=${price}\nwalksPerDay=${walksPerDay}`,
    recurrence: [`RRULE:FREQ=DAILY;UNTIL=${endDate.replaceAll("-", "")}T235959Z`],
    extendedProperties: {
      private: {
        dogName,
        serviceType,
        price: String(price),
        walksPerDay: String(walksPerDay),
      },
    },
  };

  if (isAllDay) {
    event.start = { date: startDate };
    event.end = { date: addOneDay(startDate) };
  } else {
    event.start = {
      dateTime: `${startDate}T${startTime}:00`,
      timeZone: timezone,
    };
    event.end = {
      dateTime: `${startDate}T${endTime}:00`,
      timeZone: timezone,
    };
  }

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return res.data;
}

function addOneDay(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d + 1);
  return date.toISOString().slice(0, 10);
}

module.exports = {
  createCalendarEvent,
  createServiceEvent,
};
