import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: String, required: true },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "INR" },
    },
    type: {
      type: String,
      enum: ["full-time", "part-time", "remote", "contract", "internship"],
      required: true,
    },
    skills: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "approved", "closed", "rejected"],
      default: "pending",
    },
    applicantCount: { type: Number, default: 0 },
    deadline: { type: Date },
  },
  { timestamps: true }
);

// Text index for search
jobSchema.index({ title: "text", description: "text", skills: "text" });

export default mongoose.model("Job", jobSchema);
