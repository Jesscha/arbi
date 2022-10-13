import { Contract } from "ethers";
import { ethers } from "hardhat";
import { TOKENS, TOKENS_MAP } from "../constants/tokens";
import factoryAbi from "../abis/factory.json";
import exchangeAbi from "../abis/exchange.json";
import flashLoanAbi from "../abis/flashLoan.json";
import { DODOFlashloan__factory, ERC20Mock__factory } from "../test/typechain";

// TODO: change it to simple and readable code
// 1. 거래 가능한 토큰의 종류를 불러온다.
// 토큰중 2개에 대해서 아래를 진행
// 2. 각 토큰과 USDC 풀의 주소를 구한다.
// 3. 아비트라지 기회를 찾는다.

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

const doArbitrage = async (tokenA: any, tokenB: any) => {
  // tokenA, tokenB에 대한 pool address 가져오기

  const tokenA_USDC_Pool = getPairAddress(tokenA, TOKENS_MAP["USDC"]);
  const tokenB_USDC_Pool = getPairAddress(tokenB, TOKENS_MAP["USDC"]);
  const tokenA_tokenB_Pool = getPairAddress(tokenA, tokenB);

  const tokenA_USDC_Contract = new web3.eth.Contract(
    exchangeAbi as any,
    tokenA_USDC_Pool
  );

  const tokenB_USDC_Contract = new web3.eth.Contract(
    exchangeAbi as any,
    tokenB_USDC_Pool
  );

  const tokenA_tokenB_Contract = new web3.eth.Contract(
    exchangeAbi as any,
    tokenA_tokenB_Pool
  );

  const tokenA_poolName = await tokenA_USDC_Contract.methods.name().call();
  const tokenA_poolInfo = await tokenA_USDC_Contract.methods
    .getReserves()
    .call();

  const { token0: tokenA_token0, token1: tokenA_token1 } =
    getTokensInPool(tokenA_poolName);

  const tokenA_poolUSDCPrice = getUSDCPrice(
    tokenA_poolInfo,
    tokenA_token0,
    tokenA_token1
  );
  // console.log(tokenA_relativePriceInMesh.toFixed(10));

  const tokenB_poolName = await tokenB_USDC_Contract.methods.name().call();
  const tokenB_poolInfo = await tokenB_USDC_Contract.methods
    .getReserves()
    .call();

  const { token0: tokenB_token0, token1: tokenB_token1 } =
    getTokensInPool(tokenB_poolName);

  const tokenB_poolUSDCPrice = getUSDCPrice(
    tokenB_poolInfo,
    tokenB_token0,
    tokenB_token1
  );

  // console.log(MESH_poolUSDCPrice.toFixed(10));

  const tokenA_tokenB_poolInfo = await tokenA_tokenB_Contract.methods
    .getReserves()
    .call();

  const tokenA_tokenB_poolName = await tokenA_tokenB_Contract.methods
    .name()
    .call();

  const { token0: tokenA_tokenB_token0, token1: tokenA_tokenB_token1 } =
    getTokensInPool(tokenA_tokenB_poolName);

  console.log(tokenA_tokenB_token0, tokenA_tokenB_token1);

  const { token0Price, token1Price } = getRelativePrice(
    tokenA_tokenB_poolInfo,
    tokenA_tokenB_token0,
    tokenA_tokenB_token1
  );

  const tokenA_relativePriceInMesh = getRelativeUSDCPrice(
    tokenB_poolUSDCPrice,
    token0Price.targetToken === "ETH" ? token0Price.price : token1Price.price
  );

  const tokenB_relativePriceInETH = getRelativeUSDCPrice(
    tokenA_poolUSDCPrice,
    token0Price.targetToken === "MESH" ? token0Price.price : token1Price.price
  );

  console.log(tokenA_relativePriceInMesh.toFixed(10), "eth price");
  console.log(
    tokenA_relativePriceInMesh.toFixed(10),
    "ETH_relativePriceInMesh"
  );

  console.log(tokenB_poolUSDCPrice.toFixed(10), "mesh price");
  console.log(tokenB_relativePriceInETH.toFixed(10), "MESH_relativePriceInETH");
  // 남은 일이 무엇이냐, 각 토큰의 가격을 USDC로 나타내기, 실제 가격 보다 비싼 놈을 USDC로 매수 하기, 두개 페어에서 비싼 토큰을 팔기, 판토큰을 다시 USDC로 바꾸기
  // 여기서부터는 플래시론을 써야 한다.

  let res;

  if (tokenB_poolUSDCPrice.isGreaterThan(tokenB_relativePriceInETH)) {
    // TODO: CHANGE to executedodoflash
    res = await executeDODOFlash(tokenA, tokenB, erc20Address.USDC);
  } else {
    res = await executeDODOFlash(tokenB, tokenA, erc20Address.USDC);
  }
};

async function executeDODOFlash(tokenA: any, tokenB: any, tokensToPay: any) {
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
    tokensToPay,
    tokenA,
    tokenB
  );

  await getErc20Balance(USDC, owner.address, "balance", 6);
}

async function main() {
  TOKENS.forEach((token, i) => {
    if (i === TOKENS.length - 1) return;

    doArbitrage(token, TOKENS[i + 1]);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
