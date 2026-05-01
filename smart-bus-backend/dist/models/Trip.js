"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const tripSchema = new mongoose_1.Schema({
    route: { type: mongoose_1.Schema.Types.ObjectId, ref: "Route", required: true },
    date: { type: Date, required: true },
    time_slot: {
        type: String,
        enum: ["morning", "return_1530", "return_1900"],
        required: true
    },
    total_seats: { type: Number, required: true },
    booked_seats: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["scheduled", "active", "completed", "cancelled"],
        default: "scheduled"
    },
    current_location: {
        lat: Number,
        lng: Number,
        last_updated: Date
    }
}, { timestamps: true });
tripSchema.index({ route: 1, date: 1, time_slot: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Trip", tripSchema);
