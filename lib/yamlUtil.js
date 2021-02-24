const fse = require('fs-extra');
const yaml = require('js-yaml');

const yamlUtil = {
    loadYaml(path) {
        try {
            const doc = yaml.safeLoad(fse.readFileSync(path, 'utf8'));
            return doc;
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = yamlUtil;
