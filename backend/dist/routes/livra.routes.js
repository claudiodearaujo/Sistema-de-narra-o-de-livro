"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const livra_controller_1 = require("../controllers/livra.controller");
const livra_package_controller_1 = require("../controllers/livra-package.controller");
const router = (0, express_1.Router)();
// ========== User routes ==========
// Get current user's balance
router.get('/balance', auth_middleware_1.authenticate, livra_controller_1.getBalance);
// Get current user's transaction history
router.get('/transactions', auth_middleware_1.authenticate, livra_controller_1.getTransactions);
// Get cost for a specific action
router.get('/cost/:action', auth_middleware_1.authenticate, livra_controller_1.getCost);
// Check if user can afford an amount
router.get('/can-afford', auth_middleware_1.authenticate, livra_controller_1.canAfford);
// ========== Livra Package routes (Sprint 9) ==========
// Get available Livra packages for purchase
router.get('/packages', livra_package_controller_1.getLivraPackages);
// Purchase a Livra package
router.post('/purchase/:packageId', auth_middleware_1.authenticate, livra_package_controller_1.purchaseLivraPackage);
// ========== Admin routes ==========
// Get all configuration values
router.get('/config', auth_middleware_1.authenticate, livra_controller_1.getConfig);
// Update configuration value
router.put('/config', auth_middleware_1.authenticate, livra_controller_1.updateConfig);
// Add Livras to a user (manual adjustment)
router.post('/admin/add', auth_middleware_1.authenticate, livra_controller_1.adminAddLivras);
// Get balance for a specific user
router.get('/admin/users/:userId/balance', auth_middleware_1.authenticate, livra_controller_1.getUserBalance);
// Get transactions for a specific user
router.get('/admin/users/:userId/transactions', auth_middleware_1.authenticate, livra_controller_1.getUserTransactions);
exports.default = router;
