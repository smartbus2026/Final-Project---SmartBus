"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id: id.toString(), role: role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};
const register = async (req, res) => {
    try {
        const { name, email, password, student_id, role, phone_number } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }
        const exists = await User_1.default.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const newUser = await User_1.default.create({
            name,
            email,
            password: hashed,
            student_id,
            role: role || "student",
            phone_number
        });
        return res.status(201).json({
            message: "User registered successfully",
            token: generateToken(newUser._id, newUser.role),
            user: {
                id: newUser._id,
                name: newUser.name,
                role: newUser.role
            }
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (user && (await bcryptjs_1.default.compare(password, user.password))) {
            return res.json({
                token: generateToken(user._id, user.role),
                user: { id: user._id, name: user.name, role: user.role }
            });
        }
        return res.status(401).json({ message: "Invalid email or password" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.login = login;
const getUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().select("-password");
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getUsers = getUsers;
