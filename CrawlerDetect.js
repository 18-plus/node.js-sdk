const detect = require('crawler-detect');

const spiders   = require('crawler-detect/src/spiders');
const exclusion = require('crawler-detect/src/exclusion');

class CrawlerDetect
{
    constructor() {
        this.regex     = new RegExp('('+spiders.join('|')+')', 'i');
        
        this.exclusion = exclusion
        this.exclusionCompiled = new RegExp('('+this.exclusion.join('|')+')', 'gi');
    }
    setExclusions(data) {
        this.exclusion = this.exclusion.concat(data);
        this.exclusionCompiled = new RegExp('('+this.exclusion.join('|')+')', 'gi');
    }
    isCrawler(ua) {
        if (ua !== undefined) {
            let agent = ua.replace(this.exclusionCompiled, '');
            let test = this.regex.test(agent);
            
            return test;
        }
        return false;
    }
}

module.exports = CrawlerDetect