import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createCloudinaryStorage = (opts) => ({

  _handleFile(req, file, cb) {
    const uploadOpts={...opts};

    if(opts.resource_type==="raw"){
      const extenstion= file.originalname.split(".").pop();
      uploadOpts.public_id=`${Date.now()}.${extenstion}`
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOpts,
      (error, result) => {
        if (error) return cb(error);
        console.log("Cloudinary Result:", result);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      }
    );
    file.stream.pipe(uploadStream);
  },
  _removeFile(req, file, cb) {
    cloudinary.uploader.destroy(file.filename, cb);
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only ${allowedTypes.join(", ")} files are allowed`), false);
  }
};

export const uploadResume = multer({
  storage: createCloudinaryStorage({
    folder: "jobdev/resumes",
    allowed_formats: ["pdf"],
    resource_type: "raw",
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(["application/pdf"]),
});

export const uploadPhoto = multer({
  storage: createCloudinaryStorage({
    folder: "jobdev/photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(["image/jpeg", "image/png", "image/webp"]),
});

export { cloudinary };