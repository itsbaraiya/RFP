//
// Upload Middleware
//

import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `profile-pic${ext}`; // Always same name
    
    const existingFiles = fs.readdirSync(uploadDir);
    const oldFile = existingFiles.find(f => f.startsWith("profile-pic"));
    if (oldFile) {
      try {
        fs.unlinkSync(path.join(uploadDir, oldFile));
      } catch (err) {
        console.error("Error deleting old avatar:", err);
      }
    }

    cb(null, fileName);
  },
});

export const upload = multer({ storage });

