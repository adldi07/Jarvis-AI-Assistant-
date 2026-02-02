class InMemoryAdapter {
    constructor() {
        this.files = {};
    }

    ensureDir(dirPath) {
        // In memory, we don't strictly need to create directories
        // But we could track them if we wanted to show an empty folder
        return Promise.resolve();
    }

    saveFile(filePath, content) {
        // Normalize path to use forward slashes
        const normalizedPath = filePath.replace(/\\/g, '/');
        this.files[normalizedPath] = content;
        return Promise.resolve();
    }

    getFiles() {
        return this.files;
    }

    clear() {
        this.files = {};
    }
}

module.exports = InMemoryAdapter;
