"use strict";
//
// Upload Middleware
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(__dirname, "../../uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const fileName = `profile-pic${ext}`; // Always same name
        const existingFiles = fs_1.default.readdirSync(uploadDir);
        const oldFile = existingFiles.find(f => f.startsWith("profile-pic"));
        if (oldFile) {
            try {
                fs_1.default.unlinkSync(path_1.default.join(uploadDir, oldFile));
            }
            catch (err) {
                console.error("Error deleting old avatar:", err);
            }
        }
        cb(null, fileName);
    },
});
exports.upload = (0, multer_1.default)({ storage });
