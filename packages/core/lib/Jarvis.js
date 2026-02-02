const ProjectPlanner = require('../models/ProjectPlanner');
const FileGenerator = require('../models/FileGenerator');

class CoreJarvis {
    constructor(adapter) {
        this.planner = new ProjectPlanner();
        this.generator = new FileGenerator(adapter);
    }

    async createPlan(description, authOptions) {
        return await this.planner.createProjectPlan(description, authOptions);
    }

    async generate(plan, authOptions) {
        await this.generator.generateProjectFiles(plan, authOptions);
    }
}

module.exports = CoreJarvis;
