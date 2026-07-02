import { v2 as cloudinary } from "cloudinary";
import Job from "../models/Job.js";
import {asyncHandler} from "../middleware/errorHandler.js";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";


// GET /api/v1/jobs — public, with search/filter/pagination
export const getJobs = asyncHandler(async (req, res) => {
  const {
    search,
    location,
    type,
    skills,
    minSalary,
    maxSalary,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = { status: "approved" };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (location) filter.location = { $regex: location, $options: "i" };
  if (type) filter.type = type;
  if (skills) filter.skills = { $in: skills.split(",").map((s) => s.trim()) };
  if (minSalary) filter["salary.min"] = { $gte: Number(minSalary) };
  if (maxSalary) filter["salary.max"] = { $lte: Number(maxSalary) };

  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .populate("postedBy", "name photo company")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    jobs,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
});

// GET /api/v1/jobs/:id — public
export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    "postedBy",
    "name photo company companyWebsite bio"
  );
  if (!job) return res.status(404).json({ message: "Job not found" });

  const jobObj=job.toObject();
  if(req?.user) {
    // const saved = await SavedJob.findOne({ job: req.params.id, user: req.user._id });
    const isSaved = await SavedJob.exists({ job: req.params.id, user: req.user._id });
    jobObj.isSaved=!!isSaved;
  }else{
    jobObj.isSaved=false;
  }
  console.log(jobObj);


  res.json(jobObj);
});

// POST /api/v1/jobs — recruiter only
export const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, postedBy: req.user._id });
  res.status(201).json(job);
});

// PUT /api/v1/jobs/:id — recruiter (own job) only
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized to update this job" });
  }

  // Reset to pending if major fields changed
  if (req.body.title || req.body.description) {
    req.body.status = "pending";
  }

  const updated = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json(updated);
});

// DELETE /api/v1/jobs/:id — recruiter (own job) or admin
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const isOwner = job.postedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const applications= await Application.find({ job: req.params.id });
  console.log(applications);
  const deleteResumes= applications
    .filter((el) => el.resumePublicId)
    .map((el) => 
      cloudinary.uploader.destroy(el.resumePublicId,{
        resource_type: "raw"})
    );

  await Promise.all(deleteResumes);

  
  await job.deleteOne();
  await Application.deleteMany({ job: req.params.id });
  await SavedJob.deleteMany({ job: req.params.id });

  res.json({ message: "Job deleted" });
});


// GET /api/v1/jobs/recruiter/my — recruiter's own jobs
export const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
  res.json(jobs);
});
