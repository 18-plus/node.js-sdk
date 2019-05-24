const Utils = require('./Utils');
const JWT = require('jwt-simple');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class AgeGate
{
    constructor(baseUrl = '') {
        this.title = 'The AgeGate Page';
        this.baseUrl = baseUrl;
        this.siteLogo = null;
        this.testIp = null;
        this.startFrom = '2019-07-15T12:00';
    }
    
    async run (request, response, next) {
        this.request = request
        this.response = response
        this.next = next
        
        let result = await this._run();
        
        if (typeof result != 'undefined') {
            return response.send(result)
        }
        
        return next()
    }
    _run() {
        if (!this.canStart()) {
            return;
        }
        
        // postback request
        if (typeof this.request.query.agecheck != 'undefined' ) {
            return this.callbackVerify();
        }
        
        // ajax verify check from template
        if (typeof this.request.query.ajaxVerify != 'undefined') {
            return this.ajaxVerify();
        }
        
        if (!this.isVerified() && this.IPCheck()) {
            return this.viewTemplate();
        }
    }
    
    canStart()
    {
        let start = new Date(this.startFrom);
        let now = new Date();
        
        return start <= now;
    }
    
    setTitle(title) {
        if (title) {
            this.title = title;
        }
    }
    
    setLogo(logo) {
        if (logo) {            
            this.siteLogo = logo;
        }
    }
    
    setTestIp(testIp) {
        if (testIp) {
            this.testIp = testIp;
        }
    }
    
    setStartFrom(startFrom)
    {
        if (startFrom) {
            this.startFrom = startFrom;
        }
    }
    
    IPCheck() {
        return Utils.isGB(Utils.getClientIp(this.request));
    }
    
    isVerified() {
        let ageVerified = this.request.session.ageVerified;
        if (typeof ageVerified != 'undefined' && ageVerified == true) {
            return true;
        }
        
        return false;
    }
    
    ajaxVerify() {
        // ajax request from template
        let ageVerified = this.request.session.ageVerified;
        if (typeof ageVerified != 'undefined' && ageVerified == true) {
            return 'done';
        }
        
        return 'c_wait';
    }
    
    async callbackVerify() {
        try {
            if (typeof this.request.query.jwt == 'undefined' ) {
                return 'error';
            }
            
            let jwt = this.request.query.jwt;
            
            let buff = Buffer.from(Utils.JWT_PUB, 'base64');  
            let publicKey = buff.toString('ascii');
            let decoded = JWT.decode(jwt, publicKey, false, 'HS256');
            
            return await new Promise((resolve, reject) => {            
                this.request.sessionStore.get(decoded, (err, sess) => {
                    if (sess) {                    
                        sess.ageVerified = true;
                        
                        this.request.sessionStore.set(decoded, sess);
                        
                        resolve('complete');
                    } else {
                        resolve('error');
                    }
                })
            });
        } catch (err) {
            return 'error';
        }
    }
    
    async viewTemplate() {
        let ageVerified = this.request.session.ageVerified;
        
        if (typeof ageVerified == 'undefined') {
            this.request.session.ageVerified = false;
        }
        
        let deepurl = Utils.makeUrl(this.baseUrl, this.request);
        let qrCode = await QRCode.toDataURL(deepurl);
        
        return this.renderTemplate({
            'plus18Img': Utils.imgToBase64(path.join(__dirname + '/assets/logo.png')),
            'deepurl': deepurl, 
            'qrCode': qrCode,
            'title': this.title,
            'siteLogo': this.siteLogo,
            'showLogo': this.siteLogo ? 'display: block' : 'display: none;',
        });
    }
    
    renderTemplate(data = {}) {
        let templateFile = path.join(__dirname + '/assets/template.html');            
        let templateContent = fs.readFileSync(templateFile).toString();
        
        for (let key in data) {
            templateContent = templateContent.replace(`%${key}%`, data[key]);
        }
        
        return templateContent;
    }
};

module.exports = AgeGate;