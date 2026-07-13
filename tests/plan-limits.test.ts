import { describe, expect, it } from "vitest";
import { assertCanGenerateContent } from "../lib/plan-limits";
import type { AuthenticatedUser } from "../lib/auth";

const proUser: AuthenticatedUser = {
  id: "plan-test-user",
  email: "plan-test@recastr.app",
  plan: "PRO",
  role: "member",
};

describe("temporary unlimited access", () => {
  it("allows platforms outside the legacy Pro entitlement list", async () => {
    await expect(
      assertCanGenerateContent(proUser, ["THREADS", "FACEBOOK"]),
    ).resolves.toBeUndefined();
  });
});
