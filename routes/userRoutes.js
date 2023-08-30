const express = require("express");
const userRoute = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { onlyAdmins } = require("../middleware/adminAuth");

require("../middleware/passportConfig")(passport);

const {
  getUser,
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const {
  createPlan,
  initializeTrans,
  verifyTrans,
  addWebhook,
  getPlans,
} = require("../controllers/subscriptionController");
const { register, login, auth, tokenIsValid, refreshAccessToken } = require("../middleware/auth");

userRoute.get("/getUser/:id", auth, getUser);
userRoute.get("/getUsers", auth, onlyAdmins, getUsers);
userRoute.get("/refresh", refreshAccessToken);
userRoute.get("/getPlans", getPlans);

userRoute.post("/register", register);
userRoute.post("/login", login);
userRoute.post("/tokenIsValid", tokenIsValid);
userRoute.post("/initializetrans/:id", initializeTrans);
userRoute.post("/createPlan", createPlan);
userRoute.post("/paystackWebhook", addWebhook);
userRoute.post("/verifytrans/:id", verifyTrans);

userRoute.put("/updateUser/:id", auth, updateUser);
userRoute.delete("/deleteUser/:id", auth, deleteUser);

// Redirect the user to the Google signin page
userRoute.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

// Retrieve user data using the access token received
userRoute.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user;
    jwt.sign(
      { id: user._id },
      process.env.SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) {
          return res.json({
            token: null,
          });
        }
        res.status(200).json({
          data: {
            token,
            id: user._id,
            email: user.email,
            role: user.role,
            fullname: user.fullname,
            phoneNumber: user.phoneNumber,
            isVerified: user.isVerified,
          },
          message: "User logged in successfully",
          status: 0,
        });
      }
    );
  }
);

// profile route after successful sign in
userRoute.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    console.log(req.user);
    res.send("Welcome");
    next();
  }
);

module.exports = {
  userRoute,
};
