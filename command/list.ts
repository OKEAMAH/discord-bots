export const commands = {
  faucet: {
    name: "faucet",
    type: 1, // slash command
    description: "🌳 sends mock USDC and Arbor Bonds to the specified address.",
    options: [
      {
        name: "address",
        description: "The address to send tokens to.",
        type: 3,
        required: true,
      },
      {
        name: "network",
        description: "The Ethereum network.",
        type: 3,
        required: false,
        choices: [
          {
            name: "Görli",
            value: "goerli",
          },
        ],
      },
    ],
  },
};
