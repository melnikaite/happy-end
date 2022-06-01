// SPDX-License-Identifier: MIT

pragma solidity 0.8;

import "github.com/Arachnid/solidity-stringutils/src/strings.sol";
import "hardhat/console.sol";

contract owned {
    constructor() { owner = msg.sender; }
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
}

contract withMetadata is owned {
    mapping(bytes32 => string) public metadata;
    bytes32[] public metadataKeys;

    function find(bytes32 key) public view returns (bool, uint) {
        for (uint i = 0; i < metadataKeys.length; i++) {
            if (metadataKeys[i] == key) return (true, i);
        }
        return (false, 0);
    }

    function updateMetadata(bytes32 key, string memory value) onlyOwner public {
        metadata[key] = value;
        (bool keyExists, uint keyIndex) = find(key);
        if (keyExists && keccak256(abi.encodePacked(value)) == keccak256(abi.encodePacked(""))) {
            metadataKeys[keyIndex] = metadataKeys[metadataKeys.length - 1];
            metadataKeys.pop();
        } else if (!keyExists) metadataKeys.push(key);
    }

    function metadataKeysList() public view returns (bytes32[] memory) {
        return metadataKeys;
    }
}

contract HappyEnd is withMetadata {
    using strings for *;
    struct Movie {
        bytes32 id;
        string title;
        uint256[] proposed;
        uint256 best;
    }
    mapping(bytes32 => Movie) public movies;
    bytes32[] public movieIds;
    event NewMovie(string title, bytes32 id);
    event NewStopTime(uint256 bestStopTime, bytes32 id);
    mapping(uint256 => uint256) private popularity;
    uint256 public price = 0.1 ether;

    function setPrice(uint256 newPrice) onlyOwner public {
        price = newPrice;
    }

    function mostPopular(uint256[] memory proposed) private returns(uint256) {
        for (uint256 i = 0; i < proposed.length; i++) {
            popularity[proposed[i]] += 1;
        }
        uint256 bestTime = proposed[0];
        for (uint256 i = 0; i < proposed.length; i++) {
            if(popularity[bestTime] < popularity[proposed[i]]) {
                bestTime = proposed[i];
            }
        }
        for (uint256 i = 0; i < proposed.length; i++) {
            popularity[proposed[i]] = 0;
        }
        return bestTime;
    }

    function addMovie(string memory title, uint256 stopTime) payable public {
        require(msg.value >= price, "This function is paid");
        bytes32 id = keccak256(abi.encodePacked(title));
        movieIds.push(id); // use addStopTime to avoid duplicates
        movies[id].id = id;
        movies[id].title = title;
        movies[id].proposed.push(stopTime);
        movies[id].best = mostPopular(movies[id].proposed);
        emit NewMovie(title, id);
        emit NewStopTime(stopTime, id);
        withdraw();
    }

    function addStopTime(bytes32 id, uint256 stopTime) payable public {
        require(msg.value >= price, "This function is paid");
        movies[id].proposed.push(stopTime);
        movies[id].best = mostPopular(movies[id].proposed);
        emit NewStopTime(stopTime, id);
        withdraw();
    }

    function getBestStopTime(bytes32 id) public view returns(uint256) {
        return movies[id].best;
    }

    function findMovies(string memory title) public view returns(Movie[] memory) {
        Movie[] memory results = new Movie[](movieIds.length);
        for (uint256 i = 0; i < movieIds.length; i++) {
            if(movies[movieIds[i]].title.toSlice().contains(title.toSlice())) {
                console.log(movies[movieIds[i]].title);
                results[i] = movies[movieIds[i]];
            }
        }
        return results;
    }

    function withdraw() public {
        payable(owner).transfer(address(this).balance);
    }

    fallback() payable external {
        withdraw();
    }

    receive() payable external {
        withdraw();
    }
}
