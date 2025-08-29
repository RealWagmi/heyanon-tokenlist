const fs = require('fs');
const path = require('path');

/**
 * Remove contracts from specified chain across all tokens
 * - If token exists ONLY on specified chain: delete the entire token
 * - If token exists on other chains too: remove only specified chain contract and update timestamp
 */
const removeChainTokens = (inputPath, outputPath, chainToRemove) => {
    if (!chainToRemove) {
        throw new Error('Chain name must be specified');
    }
    try {
        // Read and parse the token list
        const data = fs.readFileSync(path.join(__dirname, inputPath), 'utf-8');
        const tokenList = JSON.parse(data);

        if (!tokenList.tokens || !Array.isArray(tokenList.tokens)) {
            throw new Error('The "tokens" field is missing or not an array.');
        }

        let tokensRemoved = 0;
        let chainContractsRemoved = 0;

        // Process tokens
        const processedTokens = tokenList.tokens.filter(token => {
            if (!token.contracts || !Array.isArray(token.contracts)) {
                return true; // Keep tokens without contracts array
            }

            // Check if token has contracts on the specified chain
            const hasTargetChainContract = token.contracts.some(contract => contract.chain === chainToRemove);

            if (!hasTargetChainContract) {
                return true; // Keep tokens without target chain contracts
            }

            // Check if token has contracts on other chains (non-target)
            const nonTargetChainContracts = token.contracts.filter(contract => contract.chain !== chainToRemove);
            const targetChainContracts = token.contracts.filter(contract => contract.chain === chainToRemove);

            if (nonTargetChainContracts.length === 0) {
                // Token exists ONLY on target chain - delete entire token
                console.log(`Deleting token "${token.symbol}" (${token.name}) - exists only on ${chainToRemove}`);
                tokensRemoved++;
                return false;
            } else {
                // Token exists on other chains - remove only target chain contracts
                console.log(`Removing ${chainToRemove} contract from "${token.symbol}" (${token.name}) - exists on ${nonTargetChainContracts.length} other chains`);
                token.contracts = nonTargetChainContracts;
                token.timestamp = new Date().toISOString();
                chainContractsRemoved += targetChainContracts.length;
                return true;
            }
        });

        // Create new token list with processed tokens
        const updatedTokenList = {
            ...tokenList,
            tokens: processedTokens
        };

        // Write the updated token list to the output file
        fs.writeFileSync(
            path.join(__dirname, outputPath),
            JSON.stringify(updatedTokenList, null, 2)
        );

        console.log(`\n--- ${chainToRemove.charAt(0).toUpperCase() + chainToRemove.slice(1)} Removal Summary ---`);
        console.log(`Total tokens removed (${chainToRemove}-only): ${tokensRemoved}`);
        console.log(`${chainToRemove.charAt(0).toUpperCase() + chainToRemove.slice(1)} contracts removed from multi-chain tokens: ${chainContractsRemoved}`);
        console.log(`Updated token list written to: ${outputPath}`);

    } catch (error) {
        console.error(`Error removing ${chainToRemove} tokens:`, error.message);
        process.exit(1);
    }
};

// Example usage
if (require.main === module) {
    const inputPath = './tokens.json';
    const outputPath = './tokens.json';

    // Get chain name from command line argument
    const chainToRemove = process.argv[2];

    if (!chainToRemove) {
        console.error('Error: Chain name must be specified as a command line argument');
        console.error('Usage: node remove-chain.js <chain_name>');
        console.error('Example: node remove-chain.js fantom');
        process.exit(1);
    }

    console.log(`Starting ${chainToRemove} token removal process...`);
    removeChainTokens(inputPath, outputPath, chainToRemove);
}

// Export for use in other files
module.exports = { removeChainTokens };
