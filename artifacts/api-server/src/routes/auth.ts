import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: string;
  }
}

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, role } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user) {
    res.status(401).json({ error: "ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە" });
    return;
  }

  if (user.role !== role) {
    res.status(401).json({ error: "رۆلی هەڵبژێردراو هەڵەیە" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە" });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "چوونەژوورەوە پێویستە" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "چوونەژوورەوە پێویستە" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
  });
});

export default router;
