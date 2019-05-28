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
        this.siteQrLogo = null;
        
        this.siteName = null;
        this.customText = null;
        this.customLocation = 'top';
            
        this.backgroundColor = null;
        this.textColor = null;
            
        this.removeReference = false;
        this.removeVisiting = false;
            
        this.testMode = false;
        this.testAnyIp = false;
        this.testIp = null;
        
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
    
    setQrLogo(logo) {
        if (logo) {            
            this.siteQrLogo = logo;
        }
    }
    
    setSiteName(siteName)
    {
        if (siteName) {
            this.siteName = siteName;
        }
    }
    
    setCustomText(customText)
    {
        if (customText) {
            this.customText = customText;
        }
    }
    
    setCustomLocation(customLocation)
    {
        if (customLocation) {
            this.customLocation = customLocation;
        }
    }
    
    setBackgroundColor(backgroundColor)
    {
        if (backgroundColor) {
            this.backgroundColor = backgroundColor;
        }
    }
    
    setTextColor(textColor)
    {
        if (textColor) {
            this.textColor = textColor;
        }
    }
    
    setRemoveReference(removeReference)
    {
        if (removeReference) {
            this.removeReference = removeReference;
        }
    }
    
    setRemoveVisiting(removeVisiting)
    {
        if (removeVisiting) {
            this.removeVisiting = removeVisiting;
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
        let qrCode = await QRCode.toBuffer(deepurl, {
            width: 300,
            height: 300,
            errorCorrectionLevel: 'Q',
        });
        qrCode = Utils.insertLogo(qrCode, this.siteQrLogo);
        
        return this.renderTemplate({
            'title': this.title,
            'siteLogo': this.siteLogo,
            'showLogo': this.siteLogo ? 'display: block' : 'display: none;',
            
            'siteName': this.siteName,
            'customText': this.customText,
            'customLocationTopShow': this.customLocation == 'top' ? 'display: block;' : 'display: none;',
            'customLocationBottomShow': this.customLocation == 'bottom' ? 'display: block;' : 'display: none;',
            
            'backgroundColor': this.backgroundColor || 'rgb(247, 241, 241)',
            'textColor': this.textColor || '#212529',
            
            'removeReference': this.removeReference ? 'none' : 'block',
            'removeVisiting': this.removeVisiting ? 'none' : 'block',
            
            'deepurl': deepurl, 
            'qrCode': qrCode,
        });
    }
    
    renderTemplate(data = {}) {
        let templateFile = path.join(__dirname + '/assets/template.html');            
        let templateContent = fs.readFileSync(templateFile).toString();
        
        for (let key in data) {
            let value = data[key] || '';
            templateContent = templateContent.replace(`%${key}%`, value);
        }
        
        return templateContent;
    }
};

module.exports = AgeGate;