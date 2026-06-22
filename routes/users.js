import express from "express";
import { getProfile, updateProfile, saveJob, getSavedJobs } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { uploadPhoto } from "../services/cloudinary.js";

const router = express.Router();

router.get("/me", protect, getProfile);
router.put("/me", protect, uploadPhoto.single("photo"), updateProfile);
router.post("/save-job/:jobId", protect, saveJob);
router.get("/saved-jobs", protect, getSavedJobs);

export default router;
