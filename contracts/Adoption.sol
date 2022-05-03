pragma solidity ^0.8.0;

contract Adoption {
    address[20] public adopters;

    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    receive() external payable {}

    // Adopting a pet
    function adopt(uint256 petId) public payable returns (uint256) {
        require(petId >= 0 && petId <= 19);

        adopters[petId] = msg.sender;

        return petId;
    }

    function quickSell(uint256 petId, uint256 _amount) external {
        require(adopters[petId] == msg.sender, "Caller is not pet owner");
        address nullAddress;
        adopters[petId] = nullAddress;
        payable(msg.sender).transfer(_amount);
    }

    // Retrieving the adopters
    function getAdopters() public view returns (address[20] memory) {
        return adopters;
    }

    function withdraw(uint256 _amount) external {
        require(msg.sender == owner, "caller is not owner");
        payable(msg.sender).transfer(_amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
