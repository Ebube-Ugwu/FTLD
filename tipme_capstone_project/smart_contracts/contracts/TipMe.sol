// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TipMe{
    struct Receiver {
        string name;
        address payable wallet;
        uint256 balance;
        bool exists;
    }
    mapping(address => Receiver) public receivers;
    event TipSent(
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        string message
    );
    event AccountCreated(
        address indexed receiver,
        string name
    );
    event Withdrawal(
        address indexed receiver,
        uint256 amount
    );

    function createAccount(string calldata _name) external {
        require(!receivers[msg.sender].exists, "Account already exists");
        receivers[msg.sender] = Receiver({
            name: _name,
            wallet: payable(msg.sender),
            balance: 0,
            exists: true
        });
        emit AccountCreated(msg.sender, _name);
    }

    function tip(address _receiver, string calldata message) external payable {
        require(receivers[_receiver].exists,"Receiver does not exist");
        require(msg.value > 0, "Tip amount must be greater than zero");
        receivers[_receiver].balance = msg.value;
        emit TipSent(
            msg.sender,
            _receiver,
            msg.value,
            message
        );
    }

    function withdraw() external {
        Receiver storage r = receivers[msg.sender];
        require(r.exists, "No account found");
        require(r.balance > 0, "No balance to withdraw");

        uint256 amount = r.balance;
        r.balance = 0;

        r.wallet.transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }
}