const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const passport = require("passport");
const { saveRedirectUrl } = require('../middleware/middleware');

const userController = require("../controllers/users");

router.route("/signup")
    .get(
        userController.renderSignupForm
    )
    .post(
        wrapAsync(userController.signupUser)
    );

router.route("/login")
    .get(
        userController.renderLoginForm
    )
    .post(
        saveRedirectUrl,
        passport.authenticate('local', {
            failureRedirect: '/login',
            failureFlash: true
        }),
        userController.login
    );

router.get("/logout", userController.logout);

module.exports = router;