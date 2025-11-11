// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint value = 0;

    // Estimated execution cost: 24496 gas
    function increment() public {
        value++;
    }

    // Estimated execution cost: 24473 gas
    function decrement() public {
        require(value >0, "value cannot be less than zero");
        value--;
    }

    // Estimated execution cost: 5177 gas
    function reset() public {
        value = 0;
    }

    // Estimated execution cost: 2431 gas
    function read() public view returns (uint) {
        return value;
    }
}