# AgeGateWordpress
## Usage example 

```js
const AgeGate = require('agegatenode')
const session = require('express-session')
app.use(session({   
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
app.use((request, response, next) => {
    gate = new AgeGate.AgeGate('http://localhost:3000/');
    gate.setTitle('New super title');
    
    return gate.run(request, response, next);
})
```

## Options
```js
gate.setTitle();                    // - Text in the <title> tag
gate.setLogo();                     // - Site logo before 'Age Gate'
gate.setQrLogo();                   // - logo inside Qr-Code (local path to png image 75x75)

gate.setSiteName();                 // - Text before 'Age Gate'
gate.setCustomText();               // - Text before 'reference to Digital Economy Act' or after    
gate.setCustomLocation();           // - Position of 'agegate_custom_text'. Values: 'top', 'bottom'
                                    
gate.setBackgroundColor();          // - background color. Default: rgb(247, 241, 241)
gate.setTextColor();                // - text color. Default: #212529
                                    
gate.setRemoveReference();          // - Remove 'reference to Digital Economy Act'. Values: true, false
gate.setRemoveVisiting();           // - Remove 'you are visiting from UK' text. Values: true, false
                                    
gate.setTestMode();                 // - start AgeGate immediatelly. Values: true, false
gate.setTestAnyIp();                // - start AgeGate at any ip. Value: true, false
gate.setTestIp();                   // - set ip for testing. Example: '192.168.0.1'
                                    
gate.setStartFrom();                // - start AgeGate after this time. Default: 2019-07-15T12:00
```