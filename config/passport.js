
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // callbackURL: "/api/v1/auth/google/callback",
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true
    },
    async (req,accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        const role = req.query.state === "recruiter" ? "recruiter" : "jobseeker";
        if (user) {

          if(user.role!==role){
            return done(null,false,{
              message:`This email is registered as a ${user.role}. Please use the ${user.role} login button.`
            });
          }

          // Existing user — update oauth info if needed
          if (!user.oauthProvider) {
            user.oauthProvider = "google";
            await user.save();
          }
          return done(null, user);
        }


        // New user via Google
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          photo: profile.photos[0].value,
          oauthProvider: "google",
          isVerified: true,
          role,
        });

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

export default passport;
