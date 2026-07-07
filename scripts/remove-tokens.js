const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const chains = ['metis', 'kava_evm'];

const filePath = '../token-list.json';
const data = readFileSync(path.join(__dirname, filePath), 'utf-8');
let tokenList = JSON.parse(data);

tokenList.tokens = tokenList.tokens.filter(token => !chains.includes(token.chain));

writeFileSync(
    path.join(__dirname, filePath),
    JSON.stringify(tokenList, null, 2)
);

console.log(`Tokens removed successfully. Output written to ${path.join(__dirname, filePath)}`);