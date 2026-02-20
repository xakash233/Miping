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

    if (code.includes('`$${process.env.NEXT_PUBLIC_API_URL}')) {
        code = code.replace(/`\$\$\{process\.env\.NEXT_PUBLIC_API_URL\}/g, '`${process.env.NEXT_PUBLIC_API_URL}');
        fs.writeFileSync(f, code, 'utf8');
        changedCount++;
        console.log(`Fixed double $ in ${f}`);
    }
});
console.log(`Total changed: ${changedCount}`);
