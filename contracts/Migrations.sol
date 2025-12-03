// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Migrations {
  address public owner;
  uint256 public last_completed_migration;

  constructor() {
    owner = msg.sender;
    last_completed_migration = 0;
  }

  modifier restricted() {
    require(
      msg.sender == owner,
      "This function is restricted to the contract's owner"
    );
    _;
  }

  function setCompleted(uint256 completed) public restricted {
    last_completed_migration = completed;
  }
}
