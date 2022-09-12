// This is a file copied from https://github.com/DODOEX/dodo-example/blob/main/solidity/contracts/DODOFlashloan.sol
/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/
pragma solidity ^0.8;
// pragma solidity 0.6.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";
import "./IDODO.sol";

// interface IDODO {
//     function flashLoan(
//         uint256 baseAmount,
//         uint256 quoteAmount,
//         address assetTo,
//         bytes calldata data
//     ) external;

//     function _BASE_TOKEN_() external view returns (address);
// }

// interface IMESH_Exchange {
//     function exchangePos(address token, uint256 amount)
//         public
//         returns (uint256);
// }

// interface IERC20 {
//     function totalSupply() external view returns (uint256);
//     function balanceOf(address account) external view returns (uint256);
//     function transfer(address to, uint256 amount) external returns (bool);
//     function allowance(address owner, address spender) external view returns (uint256);
//     function approve(address spender, uint256 amount) external returns (bool);
//     function transferFrom(address from, address to, uint256 amount) external returns (bool);
//     function name() external view returns (string memory);
//     function symbol() external view returns (string memory);
//     function decimals() external view returns (uint8);
//     function burn(uint amount) external;
// }

interface IWETH {
    function deposit() external payable;

    function withdraw(uint256) external;
}

interface IMESH_ROUTER {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract DODOFlashloan {
    event checkBorrowedAmount(address token, uint256 amount);
    event payBackLoan(address token, uint256 amount);

    function dodoFlashLoan(
        address flashLoanPool, //You will make a flashloan from this DODOV2 pool
        uint256 loanAmount,
        address loanToken,
        address tokenA,
        address tokenB
    ) external {
        //Note: The data can be structured with any variables required by your logic. The following code is just an example
        bytes memory data = abi.encode(
            flashLoanPool,
            loanToken,
            loanAmount,
            tokenA,
            tokenB
        );
        address flashLoanBase = IDODO(flashLoanPool)._BASE_TOKEN_();
        if (flashLoanBase == loanToken) {
            IDODO(flashLoanPool).flashLoan(loanAmount, 0, address(this), data);
        } else {
            IDODO(flashLoanPool).flashLoan(0, loanAmount, address(this), data);
        }
    }

    function testFunction() external {}

    //Note: CallBack function executed by DODOV2(DVM) flashLoan pool
    function DVMFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }

    //Note: CallBack function executed by DODOV2(DPP) flashLoan pool
    function DPPFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }

    //Note: CallBack function executed by DODOV2(DSP) flashLoan pool
    function DSPFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }

    function _flashLoanCallBack(
        address sender,
        uint256,
        uint256,
        bytes calldata data
    ) internal {
        (
            address flashLoanPool,
            address loanToken,
            uint256 loanAmount,
            address tokenA,
            address tokenB
        ) = abi.decode(data, (address, address, uint256, address, address));

        require(
            sender == address(this) && msg.sender == flashLoanPool,
            "HANDLE_FLASH_NENIED"
        );

        console.log(tokenA, "tokenA");
        console.log(tokenB);

        //Note: Realize your own logic using the token from flashLoan pool.
        // MATIC임
        address WETH = address(0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270);
        address MESH = address(0x82362Ec182Db3Cf7829014Bc61E9BE8a2E82868a);
        address USDC = address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
        address ROUTER = address(0x10f4A785F458Bc144e3706575924889954946639);

        address[] memory t = new address[](2);

        t[0] = loanToken;
        t[1] = tokenA;

        IERC20(loanToken).approve(
            0x10f4A785F458Bc144e3706575924889954946639,
            99979948175441007468109997994817544100746810
        );
        
        IERC20(tokenA).approve(
            0x10f4A785F458Bc144e3706575924889954946639,
            99979948175441007468109997994817544100746810
        );
        IERC20(tokenB).approve(
            0x10f4A785F458Bc144e3706575924889954946639,
            99979948175441007468109997994817544100746810
        );

        uint256[] memory TOKENA_AMOUNT;

        if (tokenA == WETH) {
            TOKENA_AMOUNT = IMESH_ROUTER(ROUTER).swapExactTokensForETH(
                loanAmount,
                0,
                t,
                address(this),
                999799481754410074681
            );
        } else {
            TOKENA_AMOUNT = IMESH_ROUTER(ROUTER).swapExactTokensForTokens(
                loanAmount,
                0,
                t,
                address(this),
                999799481754410074681
            );
        }

        console.log(
            IERC20(loanToken).balanceOf(address(this)),
            "loanToken balance"
        );
        console.log(
            IERC20(tokenA).balanceOf(address(this)),
            "TOKENA_AMOUNT balance"
        );
        console.log(
            IERC20(tokenB).balanceOf(address(this)),
            "TOKENB_AMOUNT balance"
        );
        console.log("-----1------");
        t[0] = tokenA;
        t[1] = tokenB;

        

        uint256[] memory TOKENB_AMOUNT;
        // console.log(TOKENA_AMOUNT[1], 0, t,  address(this), 9999999999999999);
        // console.log(tokenB == WETH);
        // 여기서의 WETH는 WMATAIC을 의미한다.
        console.log(TOKENA_AMOUNT[1]);
        if (tokenB == WETH) {
            console.log("called11");
            console.log(TOKENA_AMOUNT[1]);
            TOKENB_AMOUNT = IMESH_ROUTER(ROUTER).swapExactTokensForETH(
                TOKENA_AMOUNT[1],
                0,
                t,
                address(this),
                9999999999999999
            );
        } else {
            console.log("called22");
            TOKENB_AMOUNT = IMESH_ROUTER(ROUTER).swapExactTokensForTokens(
                TOKENA_AMOUNT[1],
                0,
                t,
                address(this),
                9999999999999999
            );
        }

        console.log(IERC20(USDC).balanceOf(address(this)), "USDC balance");
        console.log(
            IERC20(tokenA).balanceOf(address(this)),
            "TOKENA_AMOUNT balance"
        );
        console.log(
            IERC20(tokenB).balanceOf(address(this)),
            "TOKENB_AMOUNT balance"
        );
        console.log(address(this).balance);
        // IWETH(WETH).deposit{value: address(this).balance }();
        // console.log(IERC20(WETH).balanceOf(address(this)), "MATIC balance");

        console.log("------2-----");
        t[0] = tokenB;
        t[1] = loanToken;
        if (tokenB == WETH) {
            IMESH_ROUTER(ROUTER).swapExactETHForTokens{
                value: address(this).balance
            }(0, t, address(this), 9999999999999999);
        } else {
            IMESH_ROUTER(ROUTER).swapExactTokensForTokens(
                TOKENB_AMOUNT[1],
                0,
                t,
                address(this),
                9999999999999999
            );
        }

        console.log(IERC20(USDC).balanceOf(address(this)), "USDC balance");
        console.log(
            IERC20(tokenA).balanceOf(address(this)),
            "TOKENA_AMOUNT balance"
        );
        console.log(
            IERC20(tokenB).balanceOf(address(this)),
            "TOKENB_AMOUNT balance"
        );
        console.log("-----------");

        require(
            loanAmount == IERC20(loanToken).balanceOf(address(this)),
            "The loanAmount and the current balance should be the same!"
        );

        emit checkBorrowedAmount(loanToken, loanAmount);

        if (loanAmount > 1 ether) {
            console.log("You borrowed", loanAmount / 10**18);
        }

        //Return funds
        IERC20(loanToken).transfer(flashLoanPool, loanAmount);
        emit payBackLoan(loanToken, loanAmount);
        console.log("You successfully returned loan!");
    }

    fallback() external payable {}
}
