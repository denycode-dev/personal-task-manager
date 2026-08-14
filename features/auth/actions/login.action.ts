"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import { login } from "@/features/auth/services/auth.service";
import { createSession } from "@/lib/auth/session";

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const parsed = loginSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Data tidak valid." };
  }

  const result = await login(parsed.data.password);

  if (!result.success) {
    return { error: result.error };
  }

  await createSession();
  redirect("/");
}