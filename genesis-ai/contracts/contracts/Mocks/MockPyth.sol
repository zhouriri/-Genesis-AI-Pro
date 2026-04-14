// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Pyth 价格预言机接口 (简化版)
interface IPyth {
    function getPrice(bytes32 id) external view returns (int64 price, uint64 conf);
    function getPriceNoOlderThan(bytes32 id, uint age) external view returns (int64 price, uint64 conf);
}

// Mock Pyth 合约
contract MockPyth is IPyth {
    mapping(bytes32 => int64) private prices;
    mapping(bytes32 => uint64) private confidences;

    function setPrice(bytes32 id, int64 price, uint64 conf) external {
        prices[id] = price;
        confidences[id] = conf;
    }

    function getPrice(bytes32 id) external view returns (int64 price, uint64 conf) {
        return (prices[id], confidences[id]);
    }

    function getPriceNoOlderThan(bytes32 id, uint) external view returns (int64 price, uint64 conf) {
        return (prices[id], confidences[id]);
    }
}
