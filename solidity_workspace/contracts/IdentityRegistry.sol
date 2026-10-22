// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IdentityRegistry
/// @notice One immutable username per wallet, self-registration only. No admin.
contract IdentityRegistry {
  uint256 public constant MIN_LENGTH = 3;
  uint256 public constant MAX_LENGTH = 20;

  mapping(bytes32 => address) private _ownerOfName;
  mapping(address => string) private _nameOf;
  uint256 public totalRegistered;

  error InvalidName();
  error NameTaken();
  error AlreadyRegistered();

  event NameRegistered(address indexed owner, bytes32 indexed nameHash, string name);

  /// @notice Register a username for msg.sender.
  function register(string calldata name) external {
    if (!isValidName(name)) revert InvalidName();
    if (bytes(_nameOf[msg.sender]).length != 0) revert AlreadyRegistered();
    bytes32 nameHash = keccak256(bytes(name));
    if (_ownerOfName[nameHash] != address(0)) revert NameTaken();

    _ownerOfName[nameHash] = msg.sender;
    _nameOf[msg.sender] = name;
    unchecked {
      totalRegistered++;
    }

    emit NameRegistered(msg.sender, nameHash, name);
  }

  /// @notice Resolve a username to its owner (address(0) if unregistered).
  function resolve(string calldata name) external view returns (address) {
    return _ownerOfName[keccak256(bytes(name))];
  }

  /// @notice Get the username of an address ("" if none).
  function nameOf(address owner) external view returns (string memory) {
    return _nameOf[owner];
  }

  /// @notice True if name is valid and not yet taken.
  function isAvailable(string calldata name) external view returns (bool) {
    return isValidName(name) && _ownerOfName[keccak256(bytes(name))] == address(0);
  }

  /// @notice Validate a username: 3-20 bytes, [a-z0-9-], no leading/trailing hyphen, no "--".
  function isValidName(string calldata name) public pure returns (bool) {
    bytes calldata b = bytes(name);
    uint256 len = b.length;
    if (len < MIN_LENGTH || len > MAX_LENGTH) return false;
    if (b[0] == 0x2d || b[len - 1] == 0x2d) return false;

    bool prevHyphen = false;
    for (uint256 i = 0; i < len; ) {
      bytes1 c = b[i];
      if (c == 0x2d) {
        if (prevHyphen) return false;
        prevHyphen = true;
      } else {
        bool isLower = c >= 0x61 && c <= 0x7a;
        bool isDigit = c >= 0x30 && c <= 0x39;
        if (!isLower && !isDigit) return false;
        prevHyphen = false;
      }
      unchecked {
        i++;
      }
    }
    return true;
  }
}
