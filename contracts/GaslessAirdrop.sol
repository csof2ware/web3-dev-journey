// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// ERC2771Context: aceita meta-transactions de um trusted forwarder (relayer).
// O relayer paga o gás; o contrato vê o usuário real via _msgSender().
contract GaslessAirdrop is ERC1155, Ownable, ERC2771Context {
    uint256 public constant TOKEN_ID = 0;

    bytes32 public immutable merkleRoot;
    mapping(address => bool) public hasClaimed;

    constructor(
        bytes32 _merkleRoot,
        address trustedForwarder
    ) ERC1155("") Ownable(msg.sender) ERC2771Context(trustedForwarder) {
        merkleRoot = _merkleRoot;
    }

    function claim(bytes32[] calldata proof) public {
        address sender = _msgSender();

        require(!hasClaimed[sender], "Already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(sender));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        hasClaimed[sender] = true;
        _mint(sender, TOKEN_ID, 1, "");
    }

    // --- RESOLUÇÃO DA HERANÇA EM DIAMANTE ---
    // Context (via ERC1155/Ownable) e ERC2771Context definem _msgSender.
    // O Solidity obriga o contrato derivado a escolher: ficamos com a versão
    // meta-tx-aware do ERC2771Context (extrai o usuário real do calldata).
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}
