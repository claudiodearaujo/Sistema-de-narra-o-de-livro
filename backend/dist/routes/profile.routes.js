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
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const profileController = __importStar(require("../controllers/profile.controller"));
const router = (0, express_1.Router)();
/**
 * Profile Routes
 * Base path: /api/users
 */
// Get current user's profile (must be authenticated)
router.get('/me', auth_middleware_1.authenticate, profileController.getMyProfile);
// Update current user's profile
router.put('/profile', auth_middleware_1.authenticate, profileController.updateProfile);
// Get user profile by ID
router.get('/id/:userId', auth_middleware_1.optionalAuth, profileController.getProfileById);
// Get user profile by username
router.get('/:username', auth_middleware_1.optionalAuth, profileController.getProfile);
// Get user posts by username
router.get('/:username/posts', auth_middleware_1.optionalAuth, profileController.getUserPosts);
// Get user books by username
router.get('/:username/books', auth_middleware_1.optionalAuth, profileController.getUserBooks);
exports.default = router;
