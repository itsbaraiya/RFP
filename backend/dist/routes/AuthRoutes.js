"use strict";
//
// Auth Routes
//
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
router.post("/register", AuthController_1.AuthController.register);
router.post("/login", AuthController_1.AuthController.login);
router.get("/user", AuthController_1.AuthController.user);
exports.default = router;
