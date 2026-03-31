"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const helpTicketController_1 = require("../controllers/helpTicketController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.verifyJWT);
router.post('/', helpTicketController_1.createHelpTicket);
router.get('/all', helpTicketController_1.getAllHelpTickets);
router.get('/my', helpTicketController_1.getMyHelpTickets);
router.get('/search', helpTicketController_1.searchHelpTickets);
router.get('/:id', helpTicketController_1.getHelpTicket);
router.put('/:id', helpTicketController_1.updateHelpTicket);
router.post('/:id/reply', helpTicketController_1.addReplyToTicket);
router.delete('/:id', helpTicketController_1.deleteHelpTicket);
exports.default = router;
//# sourceMappingURL=helpTickets.js.map