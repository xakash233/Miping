const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('src');
let changedCount = 0;

files.forEach(f => {
    let code = fs.readFileSync(f, 'utf8');

    // Convert single quotes to backticks around ${process.env...}
    const targetString = "'${process.env.NEXT_PUBLIC_API_URL}";
    if (code.includes(targetString)) {
        // Regex: target string, then anything until the ending single quote
        const regex = /'\$\{process\.env\.NEXT_PUBLIC_API_URL\}([^']+)'/g;
        code = code.replace(regex, "`$$${process.env.NEXT_PUBLIC_API_URL}$1`");
        fs.writeFileSync(f, code, 'utf8');
        changedCount++;
        console.log(`Fixed ${f}`);
    }
});
console.log(`Total changed: ${changedCount}`);
