import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
     oauthProvider: {
      type: String,
      enum: ["google", null],
      default: null,
    },
    passwordHash: {
      type: String,
       required: function () {
        return !this.oauthProvider;
      },
    },
    role: {
      type: String,
      enum: ["jobseeker", "recruiter", "admin"],
      default: "jobseeker",
    },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String, default: null },
    photo: { type: String, default: "" },
    skills: [{ type: String }],
    experience: { type: String, default: "" },
    company: { type: String, default: "" },
    companyWebsite: { type: String, default: "" },
    otp: { type: String },
    otpExpiry: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// To  Avoid leaking sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  return obj;
};

export default mongoose.model("User", userSchema);

// const pass = await bcrypt.hash("Romeo123", 12);
// console.log(pass);