const fs = require('fs');
const path = require('path');
const { getAddress } = require('viem');

/**
 * Normalize all 0x-prefixed addresses in the token list to their checksummed format
 * Creates a new file with normalized addresses
 */
const normalizeTokenAddresses = (inputPath, outputPath) => {
    try {
        // Read and parse the token list
        const data = fs.readFileSync(path.join(__dirname, inputPath), 'utf-8');
        const tokenList = JSON.parse(data);

        if (!tokenList.tokens || !Array.isArray(tokenList.tokens)) {
            throw new Error('The "tokens" field is missing or not an array.');
        }

        // Normalize addresses in the token list
        const normalizedTokens = tokenList.tokens.map(token => {
            // Normalize sources addresses
            if (token.sources && Array.isArray(token.sources)) {
                token.sources = token.sources.map(source => {
                    if (source.type === 'oracle' &&
                        source.data?.address &&
                        source.data.address.startsWith('0x')) {
                        source.data.address = getAddress(source.data.address);
                    }
                    return source;
                });
            }

            // Normalize contract addresses
            if (token.contracts && Array.isArray(token.contracts)) {
                token.contracts = token.contracts.map(contract => {
                    if (contract.address && contract.address.startsWith('0x')) {
                        contract.address = getAddress(contract.address);
                    }
                    return contract;
                });
            }

            return token;
        });

        // Create new token list with normalized addresses
        const normalizedTokenList = {
            ...tokenList,
            tokens: normalizedTokens
        };

        // Write the normalized token list to the output file
        fs.writeFileSync(
            path.join(__dirname, outputPath),
            JSON.stringify(normalizedTokenList, null, 2)
        );

        console.log(`Addresses normalized successfully. Output written to ${outputPath}`);
    } catch (error) {
        console.error('Error normalizing addresses:', error.message);
        process.exit(1);
    }
};

// Example usage
if (require.main === module) {
    const inputPath = './tokens.json';
    const outputPath = './tokens.json';
    normalizeTokenAddresses(inputPath, outputPath);
}

// Export for use in other files
module.exports = { normalizeTokenAddresses }; 