const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const createId = () => randomBytes(64).toString('hex');

const filePath = './tokens.json';

function main(){
    const data = fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
    const tokenList = JSON.parse(data);
    tokenList.tokens = tokenList.tokens.map((token) => {
        if (!token.id) {
            token.key = createId();
            token.timestamp = new Date().toISOString();
        }
        return token;
    });
    fs.writeFileSync(
        path.join(__dirname, filePath),
        JSON.stringify(tokenList, null, 2)
    );
}

main();