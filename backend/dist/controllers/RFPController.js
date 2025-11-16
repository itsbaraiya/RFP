"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RFPController = void 0;
const RFPService_1 = require("../services/RFPService");
class RFPController {
    // ======================================================
    // 📤 Upload RFP
    // ======================================================
    static async upload(req, res) {
        try {
            const userId = Number(req.user?.id);
            if (!userId || isNaN(userId)) {
                return res.status(401).json({ error: "Unauthorized: Invalid user ID" });
            }
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const rfp = await RFPService_1.RFPService.upload(req, userId);
            return res.status(201).json({
                message: "RFP uploaded successfully",
                rfp,
            });
        }
        catch (err) {
            console.error("Upload Error:", err);
            return res.status(500).json({ error: err.message || "File upload failed" });
        }
    }
    // ======================================================
    // ❌ Delete RFP
    // ======================================================
    static async deleteRFP(req, res) {
        try {
            const rfpId = Number(req.params.id);
            const userId = Number(req.user?.id);
            if (!rfpId || isNaN(rfpId))
                return res.status(400).json({ error: "Invalid RFP ID" });
            if (!userId || isNaN(userId))
                return res.status(401).json({ error: "Unauthorized" });
            const result = await RFPService_1.RFPService.deleteRFP(rfpId, userId);
            return res.status(200).json(result);
        }
        catch (err) {
            console.error("Delete RFP Error:", err);
            return res.status(500).json({ error: err.message || "Failed to delete RFP" });
        }
    }
    // ======================================================
    // 🧠 Analyze RFP
    // ======================================================
    static async analyze(req, res) {
        try {
            const rfpId = Number(req.params.rfpId);
            if (!rfpId || isNaN(rfpId)) {
                return res.status(400).json({ error: "Invalid RFP ID" });
            }
            const analysis = await RFPService_1.RFPService.analyze(rfpId);
            return res.status(200).json(analysis);
        }
        catch (err) {
            console.error("Analyze Error:", err);
            return res.status(500).json({ error: err.message || "Failed to analyze RFP" });
        }
    }
    // ======================================================
    // 📜 Get All RFPs for User
    // ======================================================
    static async getAll(req, res) {
        try {
            const userId = Number(req.user?.id);
            if (!userId || isNaN(userId)) {
                return res.status(401).json({ error: "Unauthorized: Invalid user ID" });
            }
            const rfps = await RFPService_1.RFPService.getAll(userId);
            return res.status(200).json(rfps);
        }
        catch (err) {
            console.error("Get All RFPs Error:", err);
            return res.status(500).json({ error: err.message || "Failed to fetch RFPs" });
        }
    }
    // ======================================================
    // 👥 Get Collaborators
    // ======================================================
    static async getCollaborators(req, res) {
        try {
            const rfpId = Number(req.params.id);
            if (!rfpId || isNaN(rfpId))
                return res.status(400).json({ error: "Invalid RFP ID" });
            const collaborators = await RFPService_1.RFPService.getCollaborators(rfpId);
            return res.status(200).json(collaborators);
        }
        catch (err) {
            console.error("Get Collaborators Error:", err);
            return res.status(500).json({ error: err.message || "Failed to fetch collaborators" });
        }
    }
    // ======================================================
    // ➕ Add Collaborator
    // ======================================================
    static async addCollaborator(req, res) {
        try {
            const rfpId = Number(req.params.id);
            const requesterId = Number(req.user?.id);
            const { email } = req.body;
            if (!rfpId || isNaN(rfpId))
                return res.status(400).json({ error: "Invalid RFP ID" });
            if (!requesterId || isNaN(requesterId))
                return res.status(401).json({ error: "Unauthorized: Invalid user ID" });
            if (!email)
                return res.status(400).json({ error: "Email is required" });
            const result = await RFPService_1.RFPService.addCollaborator(rfpId, email, requesterId);
            return res.status(201).json(result);
        }
        catch (err) {
            console.error("Add Collaborator Error:", err);
            return res.status(500).json({ error: err.message || "Failed to add collaborator" });
        }
    }
    // ======================================================
    // ❌ Remove Collaborator
    // ======================================================
    static async removeCollaborator(req, res) {
        try {
            const rfpId = Number(req.params.id);
            const userId = Number(req.params.userId);
            if (!rfpId || !userId || isNaN(rfpId) || isNaN(userId)) {
                return res.status(400).json({ error: "Invalid IDs" });
            }
            const result = await RFPService_1.RFPService.removeCollaborator(rfpId, userId);
            return res.status(200).json(result);
        }
        catch (err) {
            console.error("Remove Collaborator Error:", err);
            return res.status(500).json({ error: err.message || "Failed to remove collaborator" });
        }
    }
    // ======================================================
    // 🧠 Generate AI RFP
    // ======================================================
    static async generateAI(req, res) {
        try {
            const userId = Number(req.user?.id);
            if (!userId || isNaN(userId))
                return res.status(401).json({ error: "Unauthorized" });
            const { title, description, category, prompt } = req.body;
            const rfp = await RFPService_1.RFPService.generateAI(title, description, category, prompt, userId);
            return res.status(201).json({ message: "AI RFP generated successfully", rfp });
        }
        catch (err) {
            console.error("Generate AI RFP Error:", err);
            return res.status(500).json({ error: err.message || "Failed to generate AI RFP" });
        }
    }
    // In RFPController.ts
    static async getQuestions(req, res) {
        try {
            const rfpId = Number(req.params.id);
            if (!rfpId || isNaN(rfpId)) {
                return res.status(400).json({ error: "Invalid RFP ID" });
            }
            const questions = await RFPService_1.RFPService.getQuestions(rfpId);
            return res.status(200).json(questions);
        }
        catch (err) {
            console.error("Get Questions Error:", err);
            return res.status(500).json({ error: "Failed to load analysis" });
        }
    }
}
exports.RFPController = RFPController;
