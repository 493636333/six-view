const fs = require('fs');
export default function loader (filename, conf) {
    if (!fs.existsSync(filename)) {
        return false;
    }

    if (conf && conf.returnStream) {
    	return fs.createReadStream(filename);
    }
    return fs.readFileSync(filename, 'utf8');
};