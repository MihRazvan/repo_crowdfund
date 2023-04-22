pragma solidity ^0.8.0;

contract Crowdfunding {
    address payable public campaignOwner;
    uint256 public goal;
    uint256 public raised;
    mapping(address => uint256) public contributions;

    event ContributionReceived(address contributor, uint256 amount);

    constructor(uint256 _goal) {
        campaignOwner = payable(msg.sender);
        goal = _goal;
    }

    function contribute() external payable {
        require(raised + msg.value <= goal, "Campaign goal reached");
        raised += msg.value;
        contributions[msg.sender] += msg.value;
        emit ContributionReceived(msg.sender, msg.value);
    }

    function withdrawFunds() external {
        require(msg.sender == campaignOwner, "Only campaign owner can withdraw funds");
        require(raised >= goal, "Campaign goal not reached");
        campaignOwner.transfer(raised);
        raised = 0;
    }
}