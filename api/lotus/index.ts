import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";
import getRawBody from "raw-body";

import { Contract, providers } from "ethers";

import erc20Abi from "./erc20.json";
import { Wallet } from "ethers";
import { utils } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export default async (request, response) => {
  if (request.method === "POST") {
    const signature = request.headers["x-signature-ed25519"];
    const timestamp = request.headers["x-signature-timestamp"];
    const rawBody = await getRawBody(request);

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
      return response.status(401).send({ error: "Bad request signature" });
    }

    const message = request.body;

    if (message.type === InteractionType.PING) {
      console.log("Handling Ping request");
      response.send({
        type: InteractionResponseType.PONG,
      });
    } else if (message.type === InteractionType.APPLICATION_COMMAND) {
      switch (message.data.name.toLowerCase()) {
        case "faucet":
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

const validateParameters = (address, network, userId) => {
  if (!utils.isAddress(address)) {
    throw new Error("🍂 I couldn't verify that address.");
  }
  if (network != "rinkeby") {
    throw new Error("🍂 Only the Rinkeby testnet is supported.");
  }
  if (!userId) {
    throw new Error("🍂 You're able to request new funds every 24 hours.");
  }
};

const sendAcknowledgement = async (response) => {
  await response.status(200).send({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  });
};
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
const handleFaucetRequest = async (message, response) => {
  const address = message.data.options[0].value;
  const network = message.data.options[1].value;
  const userId = message.member.user.id;
  validateParameters(address, network, userId);

  const token = message.token;
  console.log(message);
  console.log("before ack");
  await sendAcknowledgement(response);
  console.log("after ack");
  const content = {
    content: `GM, <@${userId}>. We've dripped some tokens into your wallet at ${address} on ${network} network. Happy growing 🌳.`,
  };
  await sendFollowUp(token, content);
  // const [usdcTx, uniTx] = await call(network, address);

  // response.status(200).send({
  //   type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
  //   data,
  // });
  console.log("End Faucet Request");
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
  const mockUSDCContract = new Contract(mockUSDCAddress, erc20Abi, signer);

  const mockUNIAddress = "0x81629B9CCe9C92ec6706Acc9d9b7A7d39510985F";
  const mockUNIContract = new Contract(mockUNIAddress, erc20Abi, signer);

  const usdcTransferCall = await mockUSDCContract.transfer(address, 1);
  const uniTransferCall = await mockUNIContract.transfer(address, 1);
  console.log(Object.keys(usdcTransferCall));
  return ["meow", "bark"];
}

export const config = {
  runtime: "experimental-edge",
};
