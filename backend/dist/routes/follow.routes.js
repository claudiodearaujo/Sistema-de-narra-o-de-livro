"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const follow_controller_1 = require("../controllers/follow.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * Follow Routes
 * Base path: /api/users
 */
// Get suggested users to follow (authenticated)
router.get('/suggestions', middleware_1.authenticate, follow_controller_1.followController.getSuggestions);
// Toggle follow on a user (authenticated)
router.post('/:userId/follow', middleware_1.authenticate, follow_controller_1.followController.toggleFollow);
// Get followers of a user (public, with optional auth for isFollowing)
router.get('/:userId/followers', middleware_1.optionalAuth, follow_controller_1.followController.getFollowers);
// Get users that a user is following (public, with optional auth for isFollowing)
router.get('/:userId/following', middleware_1.optionalAuth, follow_controller_1.followController.getFollowing);
// Get follow status between current user and target (authenticated)
router.get('/:userId/follow-status', middleware_1.authenticate, follow_controller_1.followController.getFollowStatus);
// Get follower and following counts (public)
router.get('/:userId/follow-counts', middleware_1.optionalAuth, follow_controller_1.followController.getFollowCounts);
exports.default = router;
