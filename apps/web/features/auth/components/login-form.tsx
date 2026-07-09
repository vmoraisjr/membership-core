"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { loginAction } from "../actions/login";

type Props = {
  next: string;
};

export function LoginForm({
  next,
}: Props) {
  const [
    passwordVisible,
    setPasswordVisible,
  ] = useState(false);

  return (
    <form
      action={loginAction}
      className="mt-6 space-y-4"
    >
      <input
        type="hidden"
        name="next"
        value={next}
      />

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium"
        >
          Senha
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={
              passwordVisible
                ? "text"
                : "password"
            }
            required
            minLength={8}
            className="h-11 w-full rounded-xl border bg-background px-3 pr-12 text-sm"
          />

          <button
            type="button"
            aria-label={
              passwordVisible
                ? "Ocultar senha"
                : "Mostrar senha"
            }
            aria-pressed={passwordVisible}
            onClick={() =>
              setPasswordVisible(
                (current) => !current
              )
            }
            className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {passwordVisible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm"
      >
        Entrar
      </button>
    </form>
  );
}
