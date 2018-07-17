const fs = require('fs');
export default function loader (filename) {
    if (!fs.existsSync(filename)) {
        return false;
    }
    return fs.readFileSync(filename, 'utf8');
};