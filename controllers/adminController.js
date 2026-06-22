import User from "../models/User.js";
import Job from "../models/Job.js";
import { asyncHandler} from "../middleware/errorHandler.js";
import Application from "../models/Application.js";

// GET /api/v1/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalJobs, totalApplications, pendingJobs, jobsByType] =
    await Promise.all([
      User.countDocuments(),
      Job.countDocuments({ status: "approved" }),
      Application.countDocuments(),
      Job.countDocuments({ status: "pending" }),
      Job.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

  // Applications per day (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const applicationsTrend = await Application.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    totalUsers,
    totalJobs,
    totalApplications,
    pendingJobs,
    jobsByType,
    applicationsTrend,
  });
});

// GET /api/v1/admin/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const filter = role ? { role } : {};

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ users, total });
});

// GET /api/v1/admin/jobs/pending
export const getPendingJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ status: "pending" })
    .populate("postedBy", "name email company")
    .sort({ createdAt: -1 });
  res.json(jobs);
});

// PATCH /api/v1/admin/jobs/:id/status
export const updateJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "closed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!job) return res.status(404).json({ message: "Job not found" });

  res.json(job);
});

// DELETE /api/v1/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Clean up their data
  await Job.deleteMany({ postedBy: req.params.id });
  await Application.deleteMany({ applicant: req.params.id });

  res.json({ message: "User deleted" });
});
