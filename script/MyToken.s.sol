// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script}   from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {MyToken}  from "../src/MyToken.sol";

contract MyTokenScript is Script {
    function run() external {

        vm.startBroadcast();

        MyToken token = new MyToken();

        vm.stopBroadcast();

        console2.log("MyToken deployed to:", address(token));
    }
}

