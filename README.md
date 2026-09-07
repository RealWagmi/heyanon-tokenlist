# Token List Instructions

This document provides guidelines for filling out and maintaining a token list. Each token entry must meet specific criteria, and supported data sources must follow the outlined structure.

---

## **General Principles**

### **Uniqueness**
- The `symbol` fields must be unique for every token in the list.
- Before adding a new token, ensure its `symbol` are not already present in the list.
- Use validate-token-list.js and normalize-token-addresses.js before pr

### **Data Format**
- The token list must adhere to the JSON format.
- All fields must be filled out according to the specified structure.

---

## **Field Descriptions**

### **1. `name`**
- **Description**: The full name of the token.
- **Example**: `"Wrapped Ether"`

### **2. `symbol`**
- **Description**: The short symbol used to identify the token.
- **Example**: `"WETH"`

### **3. `sources`**
- **Description**: Specifies the data sources used to retrieve information about the token. Supported types are `oracle`, `binance`, and `coingecko`.

#### **Oracle**
- **Description**: A smart contract-based price oracle providing accurate and reliable token price data.
- **Fields**:
  - `chainId`: The network ID where the oracle contract is deployed.
  - `address`: The contract address providing price data.
  - `decimals`: The number of decimals used by the oracle to represent the price.
- **Example**:
  ```json
  {
      "type": "oracle",
      "data": {
          "chainId": 1,
          "address": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
          "decimals": 8
      }
  }
  ```

#### **Binance**
- **Description**: Price data from the Binance API, using trading pairs.
- **Fields**:
  - `data`: The trading pair name, e.g., `ETHUSDT`.
- **Example**:
  ```json
  {
      "type": "binance",
      "data": "ETHUSDT"
  }
  ```

#### **CoinGecko**
- **Description**: Data sourced from the CoinGecko API, including prices, market capitalization, and trading volume.
- **Fields**:
  - `data`: The token’s unique identifier on CoinGecko, typically in lowercase.
- **Example**:
  ```json
  {
      "type": "coingecko",
      "data": "ethereum"
  }
  ```

#### **Full `sources` Example**
```json
"sources": [
    {
        "type": "oracle",
        "data": {
            "chainId": 1,
            "address": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
            "decimals": 8
        }
    },
    {
        "type": "binance",
        "data": "ETHUSDT"
    },
    {
        "type": "coingecko",
        "data": "ethereum"
    }
]
```

---

### **4. `contracts`**
- **Description**: Specifies the token’s smart contracts across different networks.
- **Fields**:
  - `chainId`: The network ID where the contract is deployed.
  - `address`: The contract address.
  - `decimals`: The number of decimals supported by the token.
- **Example**:
  ```json
  "contracts": [
      { "chainId": 1, "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "decimals": 18 }
  ]
  ```

---

### **5. `logoURI`**
- **Description**: A URL pointing to the token’s logo.
- **Example**:
  ```json
  "logoURI": "https://raw.githubusercontent.com/RealWagmi/tokenlists/main/logos/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  ```

---

### **6. `timestamp`**
- **Description**: The timestamp of the last update in ISO 8601 format.
- **Example**:
  ```json
  "timestamp": "2025-01-24T09:43:21.056Z"
  ```

---

## **Example Token Entry**
```json
{
    "name": "Wrapped Ether",
    "symbol": "WETH",
    "sources": [
        {
            "type": "oracle",
            "data": {
                "chainId": 1,
                "address": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
                "decimals": 8
            }
        },
        {
            "type": "binance",
            "data": "ETHUSDT"
        },
        {
            "type": "coingecko",
            "data": "ethereum"
        }
    ],
    "contracts": [
        { "chainId": 1, "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "decimals": 18 }
    ],
    "logo": "https://raw.githubusercontent.com/RealWagmi/tokenlists/main/logos/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
    "timestamp": "2025-01-24T09:43:21.056Z"
}
```

---

## **Validation Checklist**

1. Ensure the `name` and `symbol` fields are unique.
2. Verify the structure of the JSON.
3. Confirm that the logo URL is accessible.
4. Double-check all `sources` fields for correctness:
   - Ensure `oracle` contracts are valid and deployed.
   - Verify `binance` trading pairs exist.
   - Confirm `coingecko` identifiers are accurate.

---

## **Tokenized Asset Lookup (`isStock.json`)**

The [`isStock.json`](./isStock.json) file identifies tokens on Robinhood Chain that represent tokenized real-world assets, such as stocks and exchange-traded funds. It does not store a chain ID because every address in this file belongs exclusively to Robinhood Chain.

It is stored as a JSON map where each key is the token's exact EIP-55 checksummed contract address and every value is `true`:

```json
{
    "0x84CAb63bc87912E71ad199ff14A0bA45de68FeF8": true
}
```

This structure allows applications to determine whether a token is a tokenized asset with a direct, O(1) lookup:

```ts
const isTokenizedAsset = isStock[token.address] === true;
```

The file must remain synchronized with [`token-list.json`](./token-list.json). An address must be removed from `isStock.json` when its token is removed from the token list, and newly supported tokenized assets must be added using the exact address stored in the token list.

---
