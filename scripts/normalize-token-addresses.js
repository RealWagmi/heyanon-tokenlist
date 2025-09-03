const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const { getAddress } = require('viem');

const filePath = '../token-list.json';

try {
    // Read and parse the token list
    const data = readFileSync(path.join(__dirname, filePath), 'utf-8');
    const tokenList = JSON.parse(data);

    if (!tokenList.tokens || !Array.isArray(tokenList.tokens)) {
        throw new Error('The "tokens" field is missing or not an array.');
    }

    // Normalize addresses in the token list
    const normalizedTokens = tokenList.tokens.map(token => {
        let isModified = false;

        // Normalize sources addresses
        if (token.sources && Array.isArray(token.sources)) {
            token.sources = token.sources.map(source => {
                if (source.type === 'oracle' &&
                    source.data?.address &&
                    source.data.address.startsWith('0x')) {
                    const normalizedAddress = getAddress(source.data.address);
                    if (normalizedAddress !== source.data.address) {
                        isModified = true;
                        source.data.address = normalizedAddress;
                    }
                }
                return source;
            });
        }

        // Normalize contract addresses
        if (token.contracts && Array.isArray(token.contracts)) {
            token.contracts = token.contracts.map(contract => {
                if (contract.address && contract.address.startsWith('0x')) {
                    const normalizedAddress = getAddress(contract.address);
                    if (normalizedAddress !== contract.address) {
                        isModified = true;
                        contract.address = normalizedAddress;
                    }
                }
                return contract;
            });
        }

        // Update timestamp only if addresses were modified
        if (isModified) {
            token.timestamp = new Date().toISOString();
        }

        return token;
    });

    // Create new token list with normalized addresses
    const normalizedTokenList = {
        ...tokenList,
        tokens: normalizedTokens
    };

    // Write the normalized token list to the output file
    writeFileSync(
        path.join(__dirname, filePath),
        JSON.stringify(normalizedTokenList, null, 2)
    );

    console.log(`Addresses normalized successfully. Output written to ${path.join(__dirname, filePath)}`);
} catch (error) {
    console.error('Error normalizing addresses:', error.message);
}