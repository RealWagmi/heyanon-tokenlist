const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const { getAddress } = require('viem');

const tokenListPath = '../token-list.json';
const isStockPath = '../isStock.json';

try {
    // Read and parse the token list
    const data = readFileSync(path.join(__dirname, tokenListPath), 'utf-8');
    const tokenList = JSON.parse(data);
    const isStockData = readFileSync(path.join(__dirname, isStockPath), 'utf-8');
    const isStock = JSON.parse(isStockData);

    if (!tokenList.tokens || !Array.isArray(tokenList.tokens)) {
        throw new Error('The "tokens" field is missing or not an array.');
    }
    if (!isStock || typeof isStock !== 'object' || Array.isArray(isStock)) {
        throw new Error('isStock.json must contain a JSON object.');
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
        if (token.address && token.address.startsWith('0x')) {
            const normalizedAddress = getAddress(token.address);
            if (normalizedAddress !== token.address) {
                isModified = true;
                token.address = normalizedAddress;
            }
        }

        // Check if timestamp is missing or invalid
        if (!token.timestamp || !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(token.timestamp)) {
            isModified = true;
        }

        // Update timestamp if addresses were modified or timestamp was missing
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

    const normalizedIsStock = {};
    const normalizedStockAddresses = new Set();
    const robinhoodTokensByAddress = new Map(
        normalizedTokens
            .filter(token => token.chain === 'robinhood' && typeof token.address === 'string')
            .map(token => [token.address.toLowerCase(), token])
    );

    for (const [address, value] of Object.entries(isStock)) {
        const normalizedAddress = getAddress(address);
        const normalizedKey = normalizedAddress.toLowerCase();
        if (typeof value !== 'string') {
            throw new Error(`isStock.json value for ${address} must be a ticker string.`);
        }

        const normalizedTicker = value.trim().toUpperCase();
        if (!normalizedTicker || !/^[A-Z0-9.^-]+$/.test(normalizedTicker)) {
            throw new Error(`Invalid isStock.json ticker for ${address}: ${value}`);
        }

        if (normalizedStockAddresses.has(normalizedKey)) {
            throw new Error(`Duplicate isStock.json address after normalization: ${address}`);
        }

        const robinhoodToken = robinhoodTokensByAddress.get(normalizedKey);
        if (!robinhoodToken) {
            throw new Error(`isStock.json address does not match a Robinhood token in token-list.json: ${address}`);
        }

        normalizedStockAddresses.add(normalizedKey);
        normalizedIsStock[normalizedAddress] = normalizedTicker;
    }

    // Write the normalized token list to the output file
    writeFileSync(
        path.join(__dirname, tokenListPath),
        JSON.stringify(normalizedTokenList, null, 2)
    );
    writeFileSync(
        path.join(__dirname, isStockPath),
        `${JSON.stringify(normalizedIsStock, null, 2)}\n`
    );

    console.log(`Token addresses normalized successfully. Output written to ${path.join(__dirname, tokenListPath)}`);
    console.log(`isStock.json address keys and ticker values normalized successfully. Output written to ${path.join(__dirname, isStockPath)}`);
} catch (error) {
    console.error('Error normalizing addresses:', error.message);
    process.exitCode = 1;
}
