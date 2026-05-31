import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import courtsRouter from "./courts";
import sessionsRouter from "./sessions";
import expensesRouter from "./expenses";
import winnersRouter from "./winners";
import usersRouter from "./users";
import reportsRouter from "./reports";
import settingsRouter from "./settings";
import timePresetsRouter from "./timePresets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(courtsRouter);
router.use(sessionsRouter);
router.use(expensesRouter);
router.use(winnersRouter);
router.use(usersRouter);
router.use(reportsRouter);
router.use(settingsRouter);
router.use(timePresetsRouter);

export default router;
