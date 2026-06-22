import jwt from "jsonwebtoken";
import User from "../models/User.js";


// Note Protected Routes by Verifying Acess Token

export const protect = async (req, res, next) => {
    const token = req.cookies.accessToken;

    if(!token) {
       return res.status(401).json({message: "Not authorized"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpiry -refreshToken');

        if(!req.user) {
            return res.status(401).json({message: "Not authorized"});
        }

        next();
    } catch (error) {
        console.log("jwt error",error);
        return res.status(401).json({message: error.message});
    }
};

//Role Based Access Control

export const restrictedFor = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return res.status(401).json({message: "Not authorized"});
        }
        next();
    }
}

export const emailVerified = (req, res, next) => {
    if(!req.user.isVerified) {
        return res.status(403).json({message: "Please Verify Email before continueing"});
    }
    next();
}

export const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      message: "Please verify your email before continuing",
    });
  }
  next();
};
