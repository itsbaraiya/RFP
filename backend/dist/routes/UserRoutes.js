"use strict";
//
// User Routes
//
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
router.get("/", UserController_1.UserController.getUsers);
router.post("/", UserController_1.UserController.createUser);
router.get("/:id", UserController_1.UserController.getUser);
router.put("/:id", upload_1.upload.single("avatar"), UserController_1.UserController.updateUser);
router.delete("/:id", UserController_1.UserController.deleteUser);
exports.default = router;
