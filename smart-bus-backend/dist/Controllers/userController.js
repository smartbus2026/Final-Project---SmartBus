"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteUser = exports.getProfile = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
// Get all users (admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().select("-password");
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getAllUsers = getAllUsers;
// Get logged in user profile
const getProfile = async (req, res) => {
    try {
        const user = req.user;
        const fullUser = await User_1.default.findById(user.id).select("-password");
        res.json(fullUser);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getProfile = getProfile;
const deleteUser = async (req, res) => {
    try {
        await User_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteUser = deleteUser;
const updateUser = async (req, res) => {
    try {
        const updatedUser = await User_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedUser);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.updateUser = updateUser;
