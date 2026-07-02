import express from "express";
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
} from "../controllers/jobController.js";
import { protect, restrictedFor, requireVerified, checkAuth } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/", getJobs);
router.get("/:id", checkAuth, getJob);

// Recruiter only
router.get("/recruiter/my", protect, restrictedFor("recruiter"), getMyJobs);
router.post("/", protect, restrictedFor("recruiter"), requireVerified, createJob);
router.put("/:id", protect, restrictedFor("recruiter"), updateJob);
router.delete("/:id", protect, restrictedFor("recruiter", "admin"), deleteJob);

export default router;
