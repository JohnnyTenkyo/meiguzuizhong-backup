import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { LocalUser, User } from "../../drizzle/schema";
import { verifyToken } from "../authRouter";
import { sdk } from "./sdk";

export type LocalAuthUser = Pick<LocalUser, "id" | "username">;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  localUser: LocalAuthUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let localUser: LocalAuthUser | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const authorization = opts.req.headers.authorization;
  const token = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  if (token) {
    const session = verifyToken(token);
    if (session) {
      localUser = { id: session.userId, username: session.username };
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    localUser,
  };
}
