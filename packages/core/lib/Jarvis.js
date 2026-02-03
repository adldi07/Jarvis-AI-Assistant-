const ProjectPlanner = require('../models/ProjectPlanner');
const FileGenerator = require('../models/FileGenerator');

class CoreJarvis {
    constructor(adapter) {
        this.planner = new ProjectPlanner();
        this.generator = new FileGenerator(adapter);
    }

    async createPlan(description) {
        return await this.planner.createProjectPlan(description);
    }

    async generate(plan) {
        await this.generator.generateProjectFiles(plan);
    }
}

module.exports = CoreJarvis;
