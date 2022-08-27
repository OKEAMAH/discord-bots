# Discord Bots

A garden for the robots.

This uses Vercel's serverless functions. Make sure to `vercel env pull` to get the current environment variables or fill them out according to the .env.example file.

The /api folder has a folder for each bot. The route is set via the `INTERACTIONS ENDPOINT URL`. Currently there is only one bot, Lotus. To add a new bot, add a new folder and `index.ts`.

For **testing**, I run the bot with `vercel dev` and expose the URL with [ngrok](https://ngrok.io). The tunneled URL is then set as the `INTERACTIONS ENDPOINT URL`.

To add a new command, add it to the /command/list.js file and then **register** with `yarn register <command>`. This sends a request to globally register the command to Discord.

_From [your bot page](https://discord.com/developers/applications), get the APPLICATION_ID, and PUBLIC_KEY from the general information section, and get the TOKEN from the bot section._

## 🪷 Lotus

Lotus is a token faucet for Arbor Finance.

The `resolve` command tries to resolve an interaction with a given token. At the moment it seems like Vercel serverless functions will not work with Lotus' use case. Discord interactions (slash commands) require a response within 3 seconds. This can be deferred, and it is in `sendAcknowledgement`, which then waits for a later call via the `webhooks/app_id/token` endpoint seen in `resolve.ts`.

However, after responding to the request, the serverless function ends.

One potential work-around is using the new edge serverless functions, and that can be seen in the config for 🪷 Lotus, however the total execution time is 5 seconds, which doesn't seem to be long enough to send both requests.
