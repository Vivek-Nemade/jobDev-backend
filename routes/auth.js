import express from "express";
import passport from "../config/passport.js";
import {
  register,
  verifyOTP,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
} from "../utils/tokens.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/verify-otp", verifyOTP);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);

// Google OAuth
router.get("/google",(req,res,next)=>{
  // const role = req.query.role === "recruiter" ? "recruiter" : "jobseeker";
  const role = req.query.state || "jobseeker";
  passport.authenticate("google", 
    { scope: ["profile", "email"],
      state: role,
       session: false })(req,res,next);
});

router.get(
  "/google/callback",(req,res,next) => {
  
  // passport.authenticate("google", { failureRedirect: "/login", session: false }),
  passport.authenticate("google", {  session: false },async (err,user,info) => {

    if(err){
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent("Something went wrong")}`);
    }
    if(!user){
      const msg= info?.message || "Authentication failed";
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(msg)}`);
    }

    try {
      const accessToken = generateAccessToken(req.user._id);
      const refreshToken = generateRefreshToken(req.user._id);

      req.user.refreshToken = refreshToken;
      await req.user.save();

      setTokenCookies(res, accessToken, refreshToken);
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback`);
    } catch (error) {
      console.log(error);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent("Login failed")}`);
    }
    
    
  })(req,res,next)
});

// router.get("/google/callback",(req,res,next)=>{

//   passport.authenticate("google", { session: false },(err,user,info)=>{
//     if(err){
//       return res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
//     }
//     if(!user){
//       const msg= encodedURIComponent(info?.message || "Login failed");
//       return res.redirect(`${process.env.CLIENT_URL}/login?error=${msg}`);
    
//     }
//     const accessToken = generateAccessToken(req.user._id);
//     const refreshToken = generateRefreshToken(req.user._id);
    
//     req.user.refreshToken = refreshToken;
//     await req.user.save();
    
//     setTokenCookies(res, accessToken, refreshToken);
//     res.redirect(`${process.env.CLIENT_URL}/auth/callback`);
//   })

// });

export default router;
