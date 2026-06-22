import jwt from "jsonwebtoken";

export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",

  }
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, 
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

export const clearTokenCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};
