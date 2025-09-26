// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MyToken} from "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken token;
    address alice = address(0xA11CE);
    address bob   = address(0xB0B);

    function setUp() public {
        token = new MyToken();
    }

    function test_OwnerHasPremint() public view {
        assertGt(token.balanceOf(address(this)), 0);
    }

    function test_MintAndTransfer() public {
        token.mint(alice, 100 ether);
        assertEq(token.balanceOf(alice), 100 ether);

        vm.prank(alice);
        assertTrue(token.transfer(bob, 40 ether));

        assertEq(token.balanceOf(alice), 60 ether);
        assertEq(token.balanceOf(bob),   40 ether);
    }

    function testFuzz_Transfer(uint96 amount) public {
        amount = uint96(bound(amount, 1, 1_000_000 ether));
        token.mint(alice, amount);
        vm.prank(alice);
        assertTrue(token.transfer(bob, amount));
        assertEq(token.balanceOf(bob), amount);
        assertEq(token.balanceOf(alice), 0);
    }
}

