const express =require('express');
const app = express();
const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/EdubinDB");
// import bcrypt module
const bcrypt = require('bcrypt');
// import jwt module
const jwt = require('jsonwebtoken');

// import session module
const session = require('express-session');
// import axios module
const axios = require('axios');
// import multer module
const multer = require('multer');
// import path module
const path = require('path');

// Security configuration
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, Accept, Content-Type, X-Requested-with, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS, PATCH, PUT"
    );

    next();
});
//Session Configuration
const secretKey = "sami@89";
app.use(
    session({
        secret: secretKey,
    })
);
//shortCutPath == backend/uploads
app.use('/shortCutPath', express.static(path.join('backend/uploads')))
const MIME_TYPE = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    "application/pdf": "pdf"
};
const storage = multer.diskStorage({
    // destination
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE[file.mimetype];
        if (isValid) {
            cb(null, 'backend/uploads')
        }
    },
    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('-');
        const extension = MIME_TYPE[file.mimetype];
        const imgName = name + '-' + Date.now() + '-edubin-' + '.' + extension;
        const pdfName = name + '-' + Date.now() + '-edubin-' + '.' + extension;
        cb(null, imgName,pdfName);
    }
});
const User =require('./models/user')
// Here into BL: Signup
app.post("/api/users/signup", multer({ storage: storage }).single('userFile'), (req, res) => {
     console.log("Here into signup", req.body);
    // bcrypt.hash(req.body.userPassword, 10).then((cryptedPassword) => {
    //     console.log("Here crypted pwd", cryptedPassword);
    //     req.body.userPassword = cryptedPassword;
        // req.body.userFile = `http://localhost:3000/shortCutPath/${req.file.filename}`;
        const user = new User(req.body);
        user.save();
        res.json({ message: "Signup With Success" });
    });
// });
// Here into BL: Login
app.post("/api/users/login", (req, res) => {
    console.log("Here into BL: Login", req.body);
    User.findOne({ email: req.body }).then((doc) => {
        console.log("Here doc", doc);
        if (!doc) {
            res.json({ message: "Check Your Email" });
        } else {
            // Doc exist
            bcrypt.compare(req.body.password, doc.password).then((passwordResult) => {
                console.log("Here passwordResult", passwordResult);
                if (!passwordResult) {
                    res.json({ message: "Check Your Pwd" });
                } else {
                    let userToSend = {
                        role: doc.role,
                        firstName: doc.firstName,
                        lastName: doc.lastName,
                        tel: doc.tel,
                        id: doc._id,
                        avatar: doc.avatar
                    };
                    // Encoder userToSend
                    const token = jwt.sign(userToSend, secretKey, { expiresIn: "1h" });
                    console.log("here into Login with success", token);
                    res.json({ message: "Welcome", user: token });
                }
            });
        }
    });
});
module.exports = app;