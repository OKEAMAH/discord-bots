import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";

import { Contract, providers } from "ethers";

import { abi } from "./erc20";
import { Wallet } from "ethers";
import { utils } from "ethers";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

const handleInteraction = async (request, response) => {
  if (request.method === "POST") {
    const message = await validateRequest(request, response);

    if (message.type === InteractionType.PING) {
      console.log("Handling Ping request");
      response.send({
        type: InteractionResponseType.PONG,
      });
    } else if (message.type === InteractionType.APPLICATION_COMMAND) {
      switch (message.data.name.toLowerCase()) {
        case "faucet":
          console.error("Faucet Command");
          handleFaucetRequest(message, response);
          break;
        default:
          console.error("Unknown Command");
          response.status(400).send({ error: "Unknown Type" });
          break;
      }
    } else {
      console.error("Unknown Type");
      response.status(400).send({ error: "Unknown Type" });
    }
  }
};

const handleFaucetRequest = async (message, response) => {
  const [address, network, userId] = validateParameters(message);
  const [usdcTx, uniTx] = await call(network, address);
  const data = {
    content: `🌳 GM, <@${userId}>. We've dripped some tokens into your wallet at ${address} on the ${network} network. Bright growing.

<https://rinkeby.etherscan.io/tx/${usdcTx.hash}>`,
  };

  return response.status(200).send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data,
  });
};

const validateParameters = (message) => {
  const address = message.data.options[0].value;
  const network = message.data.options[1].value;
  const userId = message.member.user.id;
  if (!utils.isAddress(address)) {
    throw new Error("🍂 I couldn't verify that address.");
  }
  if (network != "rinkeby") {
    throw new Error("🍂 Only the Rinkeby testnet is supported.");
  }
  if (!userId) {
    throw new Error("🍂 You're able to request new funds every 24 hours.");
  }
  return [address, network, userId];
};

const validateRequest = async (request, response) => {
  const signature = request.headers["x-signature-ed25519"];
  const timestamp = request.headers["x-signature-timestamp"];
  const buf = await buffer(request);
  const rawBody = buf.toString("utf8");

  if (!process.env.PUBLIC_KEY) {
    throw new Error("🍂 Add PUBLIC_KEY to the environment.");
  }
  const isValidRequest = verifyKey(
    rawBody,
    signature,
    timestamp,
    process.env.PUBLIC_KEY
  );

  if (!isValidRequest) {
    console.error("Invalid Request");
    await response.status(401).send({ error: "Bad request signature" });
    throw new Error("Invalid Request");
  }

  return JSON.parse(rawBody);
};

// Used to defer the message. No more fetch calls can be sent after.
const sendAcknowledgement = async (response) => {
  await response.status(200).send({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  });
};

// Used to edit the deffered message.
const sendFollowUp = async (token, content) => {
  await fetch(
    `https://discord.com/api/v10/webhooks/${process.env.APPLICATION_ID}/${token}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
};

const rpcUrls = {
  rinkeby: process.env.RINKEBY_RPC_URL,
};

async function call(network, address) {
  if (!process.env.FAUCET_PRIVATE_KEY) {
    throw new Error("🍂 Add FAUCET_PRIVATE_KEY to the environment.");
  }
  const provider = new providers.JsonRpcProvider(rpcUrls[network]);
  const signer = new Wallet(process.env.FAUCET_PRIVATE_KEY, provider);

  const mockUSDCAddress = "0x097B212EFc307B102B37889Bede934EEe74Cda27";
  const mockUSDCContract = new Contract(mockUSDCAddress, abi, signer);

  const mockUNIAddress = "0x81629B9CCe9C92ec6706Acc9d9b7A7d39510985F";
  const mockUNIContract = new Contract(mockUNIAddress, abi, signer);

  const usdcTransferCall = await mockUSDCContract.transfer(
    address,
    utils.parseUnits("1000000", 6)
  );

  // TODO: make this a single contract call.
  return [usdcTransferCall, "meow"];
}

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handleInteraction;
