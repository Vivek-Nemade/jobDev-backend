import Application from "../models/Application.js";
import Job from "../models/Job.js";
import {asyncHandler} from "../middleware/errorHandler.js";



// POST /api/v1/applications/:jobId — jobseeker applies
export const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  console.log("req.file:", req.file);        
  console.log("req.body:", req.body);
  // console.log("content-type:", req.headers["content-type"]);
  const job = await Job.findById(jobId);
  if (!job || job.status !== "approved") {
    return res.status(404).json({ message: "Job not found or not available" });
  }

  // Recruiters can't apply to jobs
  if (req.user.role === "recruiter") {
    return res.status(403).json({ message: "Recruiters cannot apply to jobs" });
  }

  // Check duplicate application
  const existing = await Application.findOne({
    job: jobId,
    applicant: req.user._id,
  });
  if (existing) return res.status(400).json({ message: "You already applied to this job" });

  if (!req.file) return res.status(400).json({ message: "Resume is required" });

  const application = await Application.create({
    job: jobId,
    applicant: req.user._id,
    resumeUrl: req.file.path,
    resumePublicId: req.file.filename,
    coverLetter: req.body.coverLetter || "",
    originalFilename: req.file.originalname
  });

  // Increment applicant count
  await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

  res.status(201).json(application);
});


// GET /api/v1/applications/my — jobseeker's own applications
export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate("job", "title company location type status")
    .sort({ createdAt: -1 });

  res.json(applications);
});

// GET /api/v1/applications/job/:jobId — recruiter sees applicants for their job
export const getJobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized" });
  }

  const applications = await Application.find({ job: req.params.jobId })
    .populate("applicant", "name email photo bio skills experience")
    .sort({ createdAt: -1 });

  res.json(applications);
});

// PATCH /api/v1/applications/:id/status — recruiter updates status
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["reviewed", "shortlisted", "rejected"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const application = await Application.findById(req.params.id)
    .populate("job", "title postedBy")
    .populate("applicant", "email name");

  if (!application) return res.status(404).json({ message: "Application not found" });

  if (application.job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  application.status = status;
  await application.save();

  // Send email notification
//   try {
//     await sendApplicationStatusEmail(
//       application.applicant.email,
//       application.job.title,
//       status
//     );
//   } catch (err) {
//     console.error("Email notification failed:", err.message);
//     // Don't fail the request if email fails
//   }

  res.json(application);
});
