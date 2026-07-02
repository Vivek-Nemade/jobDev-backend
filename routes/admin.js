import express from "express";
import {
  getPendingJobs,
  updateJobStatus,
  getAllUsers,
  deleteUser,
  getStats,
} from "../controllers/adminController.js";
import { protect, restrictedFor } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, restrictedFor("admin"));

router.get("/stats", getStats);
router.get("/jobs/pending", getPendingJobs);
router.patch("/jobs/:id/status", updateJobStatus);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

export default router;
