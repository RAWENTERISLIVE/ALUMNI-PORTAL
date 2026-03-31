"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchController_1 = require("../controllers/searchController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/universal', auth_1.authMiddleware, searchController_1.universalSearch);
exports.default = router;
//# sourceMappingURL=search.js.map