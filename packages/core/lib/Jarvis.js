const ProjectPlanner = require('../models/ProjectPlanner');
const FileGenerator = require('../models/FileGenerator');

class CoreJarvis {
    constructor(adapter) {
        this.planner = new ProjectPlanner();
        this.generator = new FileGenerator(adapter);
    }

    async createPlan(description, model) {
        return await this.planner.createProjectPlan(description, model);
    }

    async generate(plan) {
        await this.generator.generateProjectFiles(plan);
    }
}

module.exports = CoreJarvis;
