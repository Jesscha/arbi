import { config as dotEnvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
dotEnvConfig();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      forking: {
        // polygon
        url: process.env.ALCHEMY_POLYGON_RPC_URL as string,
        blockNumber: 28583600,
      },
    },
    polygon: {
      url: process.env.ALCHEMY_POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
  mocha: {
    timeout: 200000,
  },
};

export default config;
