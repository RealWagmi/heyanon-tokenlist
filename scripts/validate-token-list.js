const { readFileSync } = require('fs');
const path = require('path');
const { getAddress } = require('viem');

const tokenListPath = '../token-list.json';

try {
  // Read and parse the token list
  const data = readFileSync(path.join(__dirname, tokenListPath), 'utf-8');
  const tokenList = JSON.parse(data);

  const errors = [];
  const chainAddressTokens = new Map(); // Track unique combinations of chain + address
  const chainSymbolTokens = new Map(); // Track unique combinations of chain + symbol

  if (!tokenList.tokens || !Array.isArray(tokenList.tokens)) {
    errors.push('The "tokens" field is missing or not an array.');
  } else {
    console.log(`Processing ${tokenList.tokens.length} tokens...`);
    tokenList.tokens.forEach((token, index) => {
      const tokenErrors = [];
      const tokenPath = `tokens[${index}]`;

      // Validate chain
      if (!token.chain || typeof token.chain !== 'string') {
        tokenErrors.push(`${tokenPath}.chain is missing or not a string.`);
      }

      // Validate name
      if (!token.name || typeof token.name !== 'string') {
        tokenErrors.push(`${tokenPath}.name is missing or not a string.`);
      }

      // Validate symbol
      if (!token.symbol || typeof token.symbol !== 'string') {
        tokenErrors.push(`${tokenPath}.symbol is missing or not a string.`);
      }

      // Validate address
      if (!token.address || typeof token.address !== 'string') {
        tokenErrors.push(`${tokenPath}.address is missing or not a string.`);
      }

      // Validate decimals
      if (typeof token.decimals !== 'number') {
        tokenErrors.push(`${tokenPath}.decimals is missing or not a number.`);
      }

      // Check for duplicate chain + address combinations (MongoDB index: { chain: 1, address: 1 })
      if (token.chain && token.address) {
        const chainAddressKey = `${token.chain}-${token.address.toLowerCase()}`;
        if (chainAddressTokens.has(chainAddressKey)) {
          tokenErrors.push(`${tokenPath} duplicate token: chain "${token.chain}" with address "${token.address}" already exists at index ${chainAddressTokens.get(chainAddressKey)}.`);
        } else {
          chainAddressTokens.set(chainAddressKey, index);
        }
      }

      // Check for duplicate chain + symbol combinations (MongoDB index: { chain: -1, symbol: -1 })
      if (token.chain && token.symbol) {
        const chainSymbolKey = `${token.chain}-${token.symbol.toLowerCase()}`;
        if (chainSymbolTokens.has(chainSymbolKey)) {
          tokenErrors.push(`${tokenPath} duplicate token: chain "${token.chain}" with symbol "${token.symbol}" already exists at index ${chainSymbolTokens.get(chainSymbolKey)}.`);
        } else {
          chainSymbolTokens.set(chainSymbolKey, index);
        }
      }

      // Validate sources
      if (!token.sources || !Array.isArray(token.sources)) {
        tokenErrors.push(`${tokenPath}.sources is missing or not an array.`);
      } else {
        token.sources.forEach((source, sourceIndex) => {
          const sourcePath = `${tokenPath}.sources[${sourceIndex}]`;
          if (!source.type || !['oracle', 'binance', 'coingecko'].includes(source.type)) {
            tokenErrors.push(`${sourcePath}.type is missing or invalid (must be one of: oracle, binance, coingecko).`);
          }

          if (source.type === 'oracle') {
            if (!source.data || typeof source.data !== 'object') {
              tokenErrors.push(`${sourcePath}.data is missing or not an object.`);
            } else {
              if (typeof source.data.chainId !== 'number') {
                tokenErrors.push(`${sourcePath}.data.chainId is missing or not a number.`);
              }
              if (!source.data.address || typeof source.data.address !== 'string') {
                tokenErrors.push(`${sourcePath}.data.address is missing or not a string.`);
              }
              if (typeof source.data.decimals !== 'number') {
                tokenErrors.push(`${sourcePath}.data.decimals is missing or not a number.`);
              }
            }
          }

          if (source.type === 'binance' || source.type === 'coingecko') {
            if (!source.data || typeof source.data !== 'string') {
              tokenErrors.push(`${sourcePath}.data is missing or not a string.`);
            }
          }
        });
      }

      // Validate timestamp
      if (!token.timestamp || !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(token.timestamp)) {
        tokenErrors.push(`${tokenPath}.timestamp is missing or not in ISO 8601 format. Token: ${token.symbol || 'unknown'} (${token.address || 'unknown'}) - ${token.name || 'unknown'}`);
      }

      // Validate addresses in sources are correctly checksummed (for EVM chains)
      if (token.sources && Array.isArray(token.sources)) {
        token.sources.forEach((source, sourceIndex) => {
          const sourcePath = `${tokenPath}.sources[${sourceIndex}]`;
          if (source.type === 'oracle' && source.data && source.data.address) {
            if (source.data.address.startsWith('0x')) {
              try {
                const checksummedAddress = getAddress(source.data.address);
                if (checksummedAddress !== source.data.address) {
                  tokenErrors.push(`${sourcePath}.data.address is not correctly checksummed. Expected: ${checksummedAddress}, Got: ${source.data.address}`);
                }
              } catch (error) {
                tokenErrors.push(`${sourcePath}.data.address is not a valid address: ${source.data.address}`);
              }
            }
          }
        });
      }

      // Validate token address is correctly checksummed (for EVM chains only)
      if (token.address && token.address.startsWith('0x')) {
        try {
          const checksummedAddress = getAddress(token.address);
          if (checksummedAddress !== token.address) {
            tokenErrors.push(`${tokenPath}.address is not correctly checksummed. Expected: ${checksummedAddress}, Got: ${token.address}`);
          }
        } catch (error) {
          tokenErrors.push(`${tokenPath}.address is not a valid address: ${token.address}`);
        }
      }

      if (tokenErrors.length > 0) {
        errors.push(...tokenErrors);
      }
    });
  }

  if (errors.length > 0) {
    console.error('Validation errors found:\n', errors.join('\n'));
    process.exit(1);
  } else {
    console.log('Token list is valid. All addresses are correctly checksummed. No duplicate tokens found (chain+address, chain+symbol).');
  }
} catch (error) {
  console.error('Error reading or parsing token list:', error.message);
}
