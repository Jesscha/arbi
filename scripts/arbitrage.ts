import { Contract } from "ethers";
import { ethers } from "hardhat";
import { TOKENS_MAP } from "../constants/tokens";
import factoryAbi from "../abis/factory.json";
import exchangeAbi from "../abis/exchange.json";
import flashLoanAbi from "../abis/flashLoan.json";
import { DODOFlashloan__factory, ERC20Mock__factory } from "../test/typechain";

const getPairAddress = async (address1: string, address2: string) => {
  const pairAddress = await factoryContract.methods
    .getPair(address1, address2)
    .call();
  console.log(pairAddress);
  return pairAddress;
};

const divideDecimals = (amount: string, decimals: number) => {
  return new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals));
};

const getUSDCPrice = (
  pool: any,
  token0: TOKEN_TYPE,
  token1: TOKEN_TYPE
): BigNumber => {
  const isToken0USDC = token0.symbol === "USDC";
  const token0Amount = divideDecimals(pool[0], token0.decimals);
  const token1Amount = divideDecimals(pool[1], token1.decimals);

  console.log(token0Amount.toFormat(0), token1Amount.toFormat(0));
  console.log(token0Amount.dividedBy(token1Amount));

  if (isToken0USDC) {
    return token0Amount.dividedBy(token1Amount);
  } else {
    return token1Amount.dividedBy(token0Amount);
  }
};

const getRelativePrice = (
  pool: any,
  token0: TOKEN_TYPE,
  token1: TOKEN_TYPE
) => {
  const token0Amount = divideDecimals(pool[0], token0.decimals);
  const token1Amount = divideDecimals(pool[1], token1.decimals);

  const token0Price = {
    targetToken: token0.symbol,
    denomToken: token1.symbol,
    price: token1Amount.dividedBy(token0Amount),
  };

  const token1Price = {
    targetToken: token1.symbol,
    denomToken: token0.symbol,
    price: token0Amount.dividedBy(token1Amount),
  };

  return { token0Price, token1Price };
};

const getRelativeUSDCPrice = (
  denomTokenPrice: BigNumber,
  relativePrice: BigNumber
) => {
  return relativePrice.multipliedBy(denomTokenPrice);
};

const getTokensInPool = (name: string) => {
  const nameSplit = name.split(" ");
  const [t0, t1] = nameSplit[nameSplit.length - 1].split("-");
  const token0 = TOKENS_MAP[t0];
  const token1 = TOKENS_MAP[t1];

  return { token0, token1 };
};

const FlashLoan = "0x8D12a197Cb00D4747a1fe03395095CE2A5d9AB8a";

const ETH_USDC_POOL = "0x2915D57D076Ca2233F73B2E724Fea4F3DB967F9B";

const MESH_USDC_POOL = "0xaC48153F3604318F9559224931b541755aE8Ae6e";

const ETH_MESH_POOL = "0x9868b2dD31FC732A952FAAA5157Bcb91bF3c9736";

const web3 = new Web3("https://polygon-rpc.com");
const factoryContract = new web3.eth.Contract(
  factoryAbi as any,
  "0x9F3044f7F9FC8bC9eD615d54845b4577B833282d"
);
const ETH_USDC_Contract = new web3.eth.Contract(
  exchangeAbi as any,
  ETH_USDC_POOL
);
const MESH_USDC_Contract = new web3.eth.Contract(
  exchangeAbi as any,
  MESH_USDC_POOL
);
const ETH_MESH_Contract = new web3.eth.Contract(
  exchangeAbi as any,
  ETH_MESH_POOL
);

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

const findArbitrage = async () => {
  const ETH_poolName = await ETH_USDC_Contract.methods.name().call();
  const ETH_poolInfo = await ETH_USDC_Contract.methods.getReserves().call();

  const { token0: ETH_token0, token1: ETH_token1 } =
    getTokensInPool(ETH_poolName);

  const ETH_poolUSDCPrice = getUSDCPrice(ETH_poolInfo, ETH_token0, ETH_token1);
  // console.log(ETH_poolUSDCPrice.toFixed(10));

  const MESH_poolName = await MESH_USDC_Contract.methods.name().call();
  const MESH_poolInfo = await MESH_USDC_Contract.methods.getReserves().call();

  const { token0: MESH_token0, token1: MESH_token1 } =
    getTokensInPool(MESH_poolName);

  const MESH_poolUSDCPrice = getUSDCPrice(
    MESH_poolInfo,
    MESH_token0,
    MESH_token1
  );

  // console.log(MESH_poolUSDCPrice.toFixed(10));

  const ETH_MESH_poolInfo = await ETH_MESH_Contract.methods
    .getReserves()
    .call();

  const ETH_MESH_poolName = await ETH_MESH_Contract.methods.name().call();

  const { token0: ETH_MESH_token0, token1: ETH_MESH_token1 } =
    getTokensInPool(ETH_MESH_poolName);

  const { token0Price, token1Price } = getRelativePrice(
    ETH_MESH_poolInfo,
    ETH_MESH_token0,
    ETH_MESH_token1
  );

  // console.log(ETH_MESH_token0.symbol, ETH_MESH_token1.symbol);
  // console.log(token0Price.price.toFixed(10), token1Price.price.toFixed(10));

  const ETH_relativePriceInMesh = getRelativeUSDCPrice(
    MESH_poolUSDCPrice,
    token0Price.targetToken === "ETH" ? token0Price.price : token1Price.price
  );

  const MESH_relativePriceInETH = getRelativeUSDCPrice(
    ETH_poolUSDCPrice,
    token0Price.targetToken === "MESH" ? token0Price.price : token1Price.price
  );

  console.log(ETH_poolUSDCPrice.toFixed(10), "eth price");
  console.log(ETH_relativePriceInMesh.toFixed(10), "ETH_relativePriceInMesh");

  console.log(MESH_poolUSDCPrice.toFixed(10), "mesh price");
  console.log(MESH_relativePriceInETH.toFixed(10), "MESH_relativePriceInETH");
  // 남은 일이 무엇이냐, 각 토큰의 가격을 USDC로 나타내기, 실제 가격 보다 비싼 놈을 USDC로 매수 하기, 두개 페어에서 비싼 토큰을 팔기, 판토큰을 다시 USDC로 바꾸기
  // 여기서부터는 플래시론을 써야 한다.

  let res;

  if (MESH_poolUSDCPrice.isGreaterThan(MESH_relativePriceInETH)) {
    res = await executeFlashLoan(
      TOKENS_MAP.WETH.address,
      TOKENS_MAP.MESH.address,
      erc20Address.USDC
    );
  } else {
    res = await executeFlashLoan(
      TOKENS_MAP.MESH.address,
      TOKENS_MAP.WETH.address,
      erc20Address.USDC
    );
  }

  // 사야 하는 토큰, 바뀌어야 하는 토큰, 대출토큰 이 세가지를 리턴하자.
};

async function executeDODOFlash() {
  // 여기에 이제 코드를 작성하면 됩니다.

  // ABI 대신에 solidity 컨트랙트 폴더의 파일을 읽는 식으로 동작하는듯 함
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

  await getErc20Balance(USDC, owner.address, "balance", 6);
}

async function main() {
  const [tokenToBuy, tokenToSell, tokenToPay] = findArbitrage();

  if (false) {
    executeDODOFlash();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
