const fs = require('fs');
const path = require('path');

function exportData(folderPath) {
    const dataFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.json'));
    const data = [];

    for (const file of dataFiles) {
        const singleton = require(`${folderPath}/${file}`);

        // Unpack array before pushing
        if (Array.isArray(singleton))
            data.push(...singleton);
        else
            data.push(singleton)
    }
    return data;
}


module.exports = exportData;