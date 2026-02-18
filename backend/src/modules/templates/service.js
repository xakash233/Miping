const templateRepository = require('./repository');

class TemplateService {
    async createTemplate(tenantId, data) {
        // Here we might validate variables against content, etc.
        // For now, simple pass-through
        return await templateRepository.create(tenantId, data);
    }

    async getTemplates(tenantId) {
        return await templateRepository.findAll(tenantId);
    }
}

module.exports = new TemplateService();
