import jwt from 'jsonwebtoken';

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // 15 mins
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // 7 days
  });

  return { accessToken, refreshToken };
};

export const setCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  const cookieOptions = {
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  };
  
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: parseInt(process.env.ACCESS_TOKEN_MAX_AGE, 10), // 15 mins
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: parseInt(process.env.REFRESH_TOKEN_MAX_AGE, 10), // 7 days
  });
};