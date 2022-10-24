import { commands } from "./list.js";
import dotenv from "dotenv";

dotenv.config();
if (!process.env.TOKEN || !process.env.APPLICATION_ID) {
  throw new Error(
    "🍂 The environment is not properly equipped to handle this."
  );
}
if (!process.argv[2]) {
  throw new Error("🍂 Plant the command to register as an argument!");
}
const command = commands[process.argv[2]];
if (!command) {
  throw new Error(
    `🍂 The command to add, ${process.argv[2]}, has been planted, but we can't find it's instructions.`
  );
}
const registerCommand = async () => {
  const response = await fetch(
    `https://discord.com/api/v10/applications/${process.env.APPLICATION_ID}/commands`,
    {
      headers: {
        Authorization: `Bot ${process.env.TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(command),
    }
  );
  if (response.ok) {
    console.log(`🪷 Beautiful. The command was added or updated.`);
  } else {
    console.log((await response.json()).errors);
  }
};
registerCommand();
