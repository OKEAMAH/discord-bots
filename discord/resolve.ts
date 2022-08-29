import dotenv from "dotenv";
dotenv.config();

if (!process.env.APPLICATION_ID) {
  throw new Error(
    "🍂 The environment is not properly equipped to handle this."
  );
}
if (!process.argv[2]) {
  throw new Error("🍂 Plant the token as an argument!");
}
const token = process.argv[2];

const updateMessage = async (token) => {
  const response = await fetch(
    `https://discord.com/api/v10/webhooks/${process.env.APPLICATION_ID}/${token}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ content: "meow" }),
    }
  );

  if (response.ok) {
    console.log(`🪷 Beautiful. The interaction updated.`);
  } else {
    console.log((await response.json()).errors);
  }
};
updateMessage(token);
