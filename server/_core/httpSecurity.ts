import type { RequestHandler } from "express";
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  if (process.env.NODE_ENV === "production")
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  next();
};
// The process-local limiter is deliberately bounded; multi-instance deployments
// require a shared gateway limiter as described in DEPLOYMENT.md.
export function createAuthRateLimiter(
  limit = 30,
  windowMs = 15 * 60 * 1000
): RequestHandler {
  const attempts = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(req.path);
    } catch {
      res.sendStatus(400);
      return;
    }
    const sensitive = decodedPath
      .slice(1)
      .split(",")
      .some(path =>
        /^(auth\.(login|register|requestPasswordReset|resetPassword)|registration\.register)$/.test(
          path
        )
      );
    if (!sensitive) {
      next();
      return;
    }
    const origin = req.headers.origin;
    if (
      origin &&
      process.env.APP_URL &&
      new URL(process.env.APP_URL).origin !== origin
    ) {
      res.sendStatus(403);
      return;
    }
    const now = Date.now();
    if (attempts.size > 10000)
      for (const [key, value] of Array.from(attempts))
        if (value.expires <= now) attempts.delete(key);
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let entry = attempts.get(key);
    if (!entry || entry.expires <= now) {
      if (attempts.size >= 20000 && !entry) {
        res.sendStatus(429);
        return;
      }
      entry = { count: 0, expires: now + windowMs };
      attempts.set(key, entry);
    }
    entry.count++;
    if (entry.count > limit) {
      res.setHeader("Retry-After", Math.ceil((entry.expires - now) / 1000));
      res
        .status(429)
        .json({ error: "Muitas tentativas. Aguarde e tente novamente." });
      return;
    }
    next();
  };
}
