const fs = require('fs');
const path = require('path');

/**
 * Validate the token list JSON file.
 * Ensure all required fields are present, unique, and correctly formatted.
 */

const validateTokenList = (filePath) => {
  try {
    // Read and parse the token list
    const data = fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
    const tokenList = JSON.parse(data);

    const errors = [];
    const symbols = new Set();

    if (!tokenList.tokens || !Array.isArray(tokenList.tokens)) {
      errors.push('The "tokens" field is missing or not an array.');
    } else {
      tokenList.tokens.forEach((token, index) => {
        const tokenErrors = [];
        const path = `tokens[${index}]`;

        // Validate name
        if (!token.name || typeof token.name !== 'string') {
          tokenErrors.push(`${path}.name is missing or not a string.`);
        }

        // Validate symbol
        if (!token.symbol || typeof token.symbol !== 'string') {
          tokenErrors.push(`${path}.symbol is missing or not a string.`);
        } else if (symbols.has(token.symbol)) {
          tokenErrors.push(`${path}.symbol (${token.symbol}) is not unique.`);
        } else {
          symbols.add(token.symbol);
        }

        // Validate sources
        if (!token.sources || !Array.isArray(token.sources)) {
          tokenErrors.push(`${path}.source is missing or not an array.`);
        } else {
          token.sources.forEach((source, sourceIndex) => {
            const sourcePath = `${path}.source[${sourceIndex}]`;
            if (!source.type || !['oracle', 'binance', 'coingecko'].includes(source.type)) {
              tokenErrors.push(`${sourcePath}.type is missing or invalid (must be one of: oracle, binance, coingecko).`);
            }

            if (source.type === 'oracle') {
              if (!source.data || typeof source.data !== 'object') {
                tokenErrors.push(`${sourcePath}.data is missing or not an object.`);
              } else {
                if (typeof source.data.chain !== 'string') {
                  tokenErrors.push(`${sourcePath}.data.chain is missing or not a string.`);
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

        // Validate contracts
        if (!token.contracts || !Array.isArray(token.contracts)) {
          tokenErrors.push(`${path}.contracts is missing or not an array.`);
        } else {
          token.contracts.forEach((contract, contractIndex) => {
            const contractPath = `${path}.contracts[${contractIndex}]`;
            if (typeof contract.chain !== 'string') {
              tokenErrors.push(`${contractPath}.chainId is missing or not a string.`);
            }
            if (!contract.address || typeof contract.address !== 'string') {
              tokenErrors.push(`${contractPath}.address is missing or not a string.`);
            }
            if (typeof contract.decimals !== 'number') {
              tokenErrors.push(`${contractPath}.decimals is missing or not a number.`);
            }
          });
        }

        // Validate logo
        if(token.logo){
          if (typeof token.logo !== 'string' || !token.logo.startsWith('http')) {
            tokenErrors.push(`${path}.logo is missing, not a string, or not a valid URL.`);
          }
        }

        // Validate timestamp
        if (!token.timestamp || !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(token.timestamp)) {
          tokenErrors.push(`${path}.timestamp is missing or not in ISO 8601 format.`);
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
      console.log('Token list is valid.');
    }
  } catch (error) {
    console.error('Error reading or parsing token list:', error.message);
    process.exit(1);
  }
};

// Path to the token list JSON file (adjust as needed for your GitHub Actions workflow)
const tokenListPath = './tokens.json';
validateTokenList(tokenListPath);
