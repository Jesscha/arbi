import { Contract } from "ethers";
import { ethers } from "hardhat";
import { DODOFlashloan__factory, ERC20Mock__factory } from "../test/typechain";

export const getContractFromAddress = async (
  contractName: string,
  factoryType: any,
  address: string
) => {
  const factory = (await ethers.getContractFactory(
    contractName
  )) as typeof factoryType;

  return factory.attach(address);
};

export const erc20Address = {
  DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  WETH: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  WMATIC: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
};

export const dodoV2Pool = {
  WETH_USDC: "0x5333Eb1E32522F1893B7C9feA3c263807A02d561",
  WMATIC_USDC: "0x10Dd6d8A29D489BEDE472CC1b22dc695c144c5c7",
  WMATIC_WETH: "0x80db8525F61e8C3688DBb7fFa9ABcae05Ae8a90A",
  WBTC_USDC: "0xe020008465cD72301A18b97d33D73bF44858A4b7",
};

export const getERC20ContractFromAddress = async (address: string) => {
  const factory = (await ethers.getContractFactory(
    "ERC20Mock"
  )) as ERC20Mock__factory;
  return factory.attach(address);
};

export const getBigNumber = (amount: number, decimals = 18) => {
  return ethers.utils.parseUnits(amount.toString(), decimals);
};

export const getErc20Balance = async (
  contract: Contract,
  address: string,
  name: string,
  decimals: number
) => {
  const [balance] = await Promise.all([contract.balanceOf(address)]);

  console.log(name, ethers.utils.formatUnits(balance, decimals));
};

async function main() {
  // 여기에 이제 코드를 작성하면 됩니다.

  // ABI 대신에 solidity 컨트랙트 코드를 읽는 식으로 동작하는듯 함
  const Flashloan = await getContractFromAddress(
    "DODOFlashloan",
    DODOFlashloan__factory,
    "0x511930A41fae024714948b700764394CB759B72f"
  );

  const [owner] = await ethers.getSigners();

  const USDC = await getERC20ContractFromAddress(erc20Address.USDC);

  const tx = await Flashloan.dodoFlashLoan(
    dodoV2Pool.WETH_USDC,
    getBigNumber(1000, 6),
    erc20Address.USDC,
    erc20Address.WETH,
    erc20Address.WMATIC
  );

  console.log(tx.hash);
  await getErc20Balance(USDC, owner.address, "balance", 6);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
