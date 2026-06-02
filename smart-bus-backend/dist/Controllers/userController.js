"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentAttendanceHistory = exports.updateUser = exports.deleteUser = exports.getProfile = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Booking_model_1 = __importDefault(require("../models/Booking.model"));
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
// Admin: Get a student's full profile + attendance history
const getStudentAttendanceHistory = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User_1.default.findById(studentId).select("-password");
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }
        const bookings = await Booking_model_1.default.find({
            user: studentId,
            attendanceStatus: { $in: ["completed", "missed"] }
        })
            .populate("route", "name")
            .sort({ date: -1 });
        const completed = bookings.filter((b) => b.attendanceStatus === "completed").length;
        const missed = bookings.filter((b) => b.attendanceStatus === "missed").length;
        return res.status(200).json({
            status: "success",
            data: {
                student,
                bookings,
                stats: { completed, missed, total: bookings.length }
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getStudentAttendanceHistory = getStudentAttendanceHistory;
