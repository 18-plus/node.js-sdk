const ipranges = require('./GbIpData')
const JWT = require('jwt-simple');

const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

class Utils
{
    static get AgeCheckURL() {
        return "https://deep.reallyme.net/agecheck";
    }
    static get JWT_PUB() {
        return 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF6YjRtcjhqcHh3NXJSU2pqK1NEQQo2cG9GNlFmaXp4dEtUZlVWQTYwTG1XTXJQeS93MWF4KzBsb1lxWWRYT2lVRmhETWhSQ2JiQjVaTmhzcDFEbklnCm03NTdVMldIaXJhOVFQcUNXTmo4Ymo0L1dxN0FwT3hFT0ZQVWFLeTVZZlRjaWQxU3VLWHpZNDNWa21NYUdUYnUKOXFJTWRzcitHU2lTTmdzZlNEcVNIeG4wL0Z5aFFkZTcwbWZjMTh1V3h5ZGVXTm5hRkhjeUZpMWFsbWUyZGREZQpHSlRta043YkZUT2ZHZXM5RkdDZWZzckI3MDRMcE8wcHo2ZjhHNlhsVmZQb0IwY2liWno3SlpHU0g5bHB1RkVkCm5MM2RVRFdvL3BBNzR3REJsSncrVThZWkN3eG1jeFZLVWRwejV1ZUJOMGc1WnN0czhjQjV6Y2V2aHZHSUIzazMKOVFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==';
    }
    
    static getClientIp(req) {
        let ip = req.headers['x-forwarded-for'] || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        return ip && ip != '::1' ? ip : '127.0.0.1';
    }
    
    static IPToUint32(ip) {
        let result = ip.split('.').map((octet, index, array) => {
            return parseInt(octet) * Math.pow(256, (array.length - index - 1));
        }).reduce((prev, curr) => {
            return prev + curr;
        });
        
        return result
    }
    
    static isGB(ip1) {
        let ip2 = Utils.IPToUint32(ip1);
        
        for (let i = 0; i < ipranges.length; i += 2) {
            if (typeof ipranges[i+1] == 'undefined') {
                return false;
            }
            if (ipranges[i] <= ip2 && ip2 <= ipranges[i+1]) {
                return true;
            }
        }
        
        return false;
    }
    
    static makeUrl(baseUrl, req) {
        let returnURL = (req.connection.encrypted ? 'https' : 'http') + '://' + req.headers.host;
        
        let buff = Buffer.from(Utils.JWT_PUB, 'base64');  
        let publicKey = buff.toString('ascii');
        let encoded = JWT.encode(req.sessionID, publicKey);
        
        baseUrl += '?jwt=' + encoded;
        baseUrl += '&agecheck=true';
        baseUrl = encodeURIComponent(baseUrl);
        returnURL = encodeURIComponent(returnURL);
        
        let url = `${this.AgeCheckURL}?postback=${baseUrl}&url=${returnURL}`;

        return url;
    }
    
    static insertLogo(qrCode, siteLogo = '') {
        let qrCode_png = PNG.sync.read(qrCode);
        let qrWidth = qrCode_png.width;
        let qrHeight = qrCode_png.height;

        let dst = new PNG({width: qrWidth, height: qrHeight});
        
        if (siteLogo) {
            var emblem = fs.readFileSync(siteLogo);
        } else {            
            var emblem = fs.readFileSync(path.join(__dirname + '/assets/emblem.png'));
        }
        let emblem_png = PNG.sync.read(emblem);
        let emblemWidth = emblem_png.width;
        let emblemHeight = emblem_png.height;
        
        PNG.bitblt(qrCode_png, dst, 0, 0, qrWidth, qrHeight, 0, 0);
        PNG.bitblt(emblem_png, dst, 0, 0, emblemWidth, emblemHeight, (qrWidth - emblemWidth) / 2, (qrHeight - emblemHeight) / 2);
        
        let buffer = PNG.sync.write(dst);
        
        return "data:image/png;base64," + buffer.toString('base64');
    }
    
    static imgToBase64(file) {
        return "data:image/png;base64," + fs.readFileSync(file, 'base64');
    }
}

module.exports = Utils