'use strict';
const db = require('../../model')();
const User = db.models.User;
const Item = db.models.Item;
const Title = db.models.Title;
db.sync().then(() => {
    return User.initializeUser("ABCDEK");
}).then(user => {
    console.log(user.userCode);
    return user;
}).catch(err => console.error(err));

