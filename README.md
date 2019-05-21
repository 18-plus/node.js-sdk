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
