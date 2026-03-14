"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (UserRole = {}));
const jobController_1 = require("../controllers/jobController");
const router = express_1.default.Router();
router.get('/', jobController_1.getJobs);
router.get('/saved', auth_1.authMiddleware, jobController_1.getSavedJobs);
router.get('/applied', auth_1.authMiddleware, jobController_1.getAppliedJobs);
router.get('/stats', auth_1.authMiddleware, (0, auth_1.requireRole)([UserRole.ADMIN, UserRole.SUPER_ADMIN]), jobController_1.getJobStats);
router.post('/', auth_1.authMiddleware, jobController_1.createJob);
router.put('/:id', auth_1.authMiddleware, jobController_1.updateJob);
router.delete('/:id', auth_1.authMiddleware, jobController_1.deleteJob);
router.post('/:id/save', auth_1.authMiddleware, jobController_1.saveJob);
router.delete('/:id/save', auth_1.authMiddleware, jobController_1.unsaveJob);
router.post('/:id/save-toggle', auth_1.authMiddleware, jobController_1.toggleSaveJob);
router.post('/:id/apply', auth_1.authMiddleware, jobController_1.incrementApplicationCount);
router.get('/:id', jobController_1.getJobById);
exports.default = router;
//# sourceMappingURL=jobs.js.map