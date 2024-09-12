const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");

const router = express.Router();

// Routes for auth
router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
router.route("/signout").get(authController.protect, authController.signout);
router
  .route("/isLoggedIn")
  .get(authController.protect, authController.isLoggedIn);

// Routes for data about users
router
  .route("/myProfile")
  .get(authController.protect, userController.getCurrentUserProfile);

module.exports = router;
