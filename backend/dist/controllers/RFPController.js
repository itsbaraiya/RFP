"use strict";
//
// RFP Controller
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.RFPController = void 0;
const RFPService_1 = require("../services/RFPService");
class RFPController {
    // ==============================
    // 📤 Upload RFP
    // ==============================
    static async upload(req, res) {
        try {
            const userId = Number(req.user?.id);
            if (!userId)
                throw new Error("Unauthorized: User ID missing");
            const result = await RFPService_1.RFPService.upload(req, userId);
            res.status(201).json(result);
        }
        catch (err) {
            console.error("Upload Error:", err.message || err);
            res.status(400).json({
                error: err.message || "File upload failed",
            });
        }
    }
    // ==============================
    // 📜 Get All RFPs (for user)
    // ==============================
    static async getAll(req, res) {
        try {
            const userId = Number(req.user?.id);
            if (!userId)
                throw new Error("Unauthorized: User ID missing");
            const rfps = await RFPService_1.RFPService.getAll(userId);
            res.json(rfps);
        }
        catch (err) {
            console.error("Get All RFPs Error:", err.message || err);
            res.status(500).json({
                error: err.message || "Failed to fetch RFPs",
            });
        }
    }
    // ==============================
    // 🧠 Analyze RFP
    // ==============================
    static async analyze(req, res) {
        try {
            const rfpId = Number(req.params.rfpId);
            if (isNaN(rfpId))
                throw new Error("Invalid RFP ID");
            const analysis = await RFPService_1.RFPService.analyze(rfpId);
            res.json(analysis);
        }
        catch (err) {
            console.error("Analyze RFP Error:", err.message || err);
            res.status(500).json({
                error: err.message || "Failed to analyze RFP",
            });
        }
    }
    // ==============================
    // 👥 Get Collaborators
    // ==============================
    static async getCollaborators(req, res) {
        try {
            const rfpId = Number(req.params.id);
            if (isNaN(rfpId))
                throw new Error("Invalid RFP ID");
            const collaborators = await RFPService_1.RFPService.getCollaborators(rfpId);
            res.json(collaborators);
        }
        catch (err) {
            console.error("Get Collaborators Error:", err.message || err);
            res.status(500).json({ error: err.message || "Failed to fetch collaborators" });
        }
    }
    // ==============================
    // ➕ Add Collaborator
    // ==============================
    static async addCollaborator(req, res) {
        try {
            const rfpId = Number(req.params.id);
            if (isNaN(rfpId))
                throw new Error("Invalid RFP ID");
            const { email } = req.body;
            const requesterId = Number(req.user?.id);
            if (!requesterId)
                throw new Error("Unauthorized: User ID missing");
            const result = await RFPService_1.RFPService.addCollaborator(rfpId, email, requesterId);
            res.status(201).json(result);
        }
        catch (err) {
            console.error("Add Collaborator Error:", err.message || err);
            res.status(400).json({ error: err.message || "Failed to add collaborator" });
        }
    }
    // ==============================
    // ❌ Remove Collaborator (Optional)
    // ==============================
    static async removeCollaborator(req, res) {
        try {
            const rfpId = Number(req.params.id);
            const userId = Number(req.params.userId);
            if (isNaN(rfpId) || isNaN(userId))
                throw new Error("Invalid ID");
            const result = await RFPService_1.RFPService.removeCollaborator(rfpId, userId);
            res.json(result);
        }
        catch (err) {
            console.error("Remove Collaborator Error:", err.message || err);
            res.status(400).json({ error: err.message || "Failed to remove collaborator" });
        }
    }
}
exports.RFPController = RFPController;
