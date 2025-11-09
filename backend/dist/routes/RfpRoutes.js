"use strict";
//
// RFP Routes
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const RFPController_1 = require("../controllers/RFPController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
const uploadDir = path_1.default.join(__dirname, "../../uploads/rfps");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = (0, multer_1.default)({ storage });
router.post("/upload", auth_1.authMiddleware, upload.single("rfp"), RFPController_1.RFPController.upload);
router.get("/", auth_1.authMiddleware, RFPController_1.RFPController.getAll);
router.post("/analyze/:rfpId", auth_1.authMiddleware, RFPController_1.RFPController.analyze);
router.get("/:id/collaborators", auth_1.authMiddleware, RFPController_1.RFPController.getCollaborators);
router.post("/:id/collaborators", auth_1.authMiddleware, RFPController_1.RFPController.addCollaborator);
// router.delete("/:id/collaborators/:userId", authMiddleware, RFPController.removeCollaborator);
exports.default = router;
