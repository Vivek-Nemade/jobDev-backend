import express from "express";
import {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { protect, restrictedFor, requireVerified } from "../middleware/auth.js";
import { uploadResume } from "../services/cloudinary.js";

const router = express.Router();

router.post(
  "/:jobId",
  protect,
  restrictedFor("jobseeker"),
  requireVerified,
  uploadResume.single("resume"),
  applyToJob
);

router.get("/my", protect, restrictedFor("jobseeker"), getMyApplications);
router.get("/job/:jobId", protect, restrictedFor("recruiter", "admin"), getJobApplicants);
router.patch("/:id/status", protect, restrictedFor("recruiter"), updateApplicationStatus);

export default router;
