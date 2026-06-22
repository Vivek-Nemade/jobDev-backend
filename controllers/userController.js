import { asyncHandler } from "../middleware/errorHandler.js";
import SavedJob from "../models/SavedJob.js";
import User from "../models/User.js";


// GET /api/v1/users/me
export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});


// PUT /api/v1/users/me
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "bio", "skills", "experience", "company", "companyWebsite"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.file) updates.photo = req.file.path;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json(user);
});

// POST /api/v1/users/save-job/:jobId
export const saveJob = asyncHandler(async (req, res) => {
  const existing = await SavedJob.findOne({
    user: req.user._id,
    job: req.params.jobId,
  });

  if (existing) {
    await existing.deleteOne();
    return res.json({ message: "Job unsaved", saved: false });
  }

  await SavedJob.create({ user: req.user._id, job: req.params.jobId });
  res.json({ message: "Job saved", saved: true });
});


// GET /api/v1/users/saved-jobs
export const getSavedJobs = asyncHandler(async (req, res) => {
  const saved = await SavedJob.find({ user: req.user._id })
    .populate("job", "title company location type salary status createdAt")
    .sort({ createdAt: -1 });

  res.json(saved.filter((s) => s.job)); // filter out deleted jobs
});
