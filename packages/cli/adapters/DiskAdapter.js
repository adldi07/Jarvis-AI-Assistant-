const fs = require('fs');
const path = require('path');

class DiskAdapter {
    constructor(baseDir) {
        this.baseDir = baseDir || process.cwd();
    }

    ensureDir(dirPath) {
        // If dirPath is absolute, use it. If relative, join with baseDir.
        // However, usually we receive relative paths from FileGenerator.
        const fullPath = path.resolve(this.baseDir, dirPath);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    }

    saveFile(filePath, content) {
        const fullPath = path.resolve(this.baseDir, filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content, 'utf8');
    }
}

module.exports = DiskAdapter;
