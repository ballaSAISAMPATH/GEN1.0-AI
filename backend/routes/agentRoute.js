const router = require('express').Router();
const { agentController, getInsights } = require("../controllers/agentController");

router.post("/api/chat",agentController)
router.get("/api/insights",getInsights)
module.exports = router;