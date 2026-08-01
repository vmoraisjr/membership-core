"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useTranslations } from "@/i18n/provider";
import { SHEEP_SYMBOL_BLUE_PATH } from "@/lib/branding";

import { loginAction } from "../actions/login";

type Props = {
  next: string;
};

function SubmitButton() {
  const t = useTranslations();
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending
        ? t("auth.login.enteringButton")
        : t("auth.login.enterButton")}
    </Button>
  );
}

export function LoginForm({
  next,
}: Props) {
  const t = useTranslations();
  const formRef =
    useRef<HTMLFormElement>(null);
  const allowSubmitRef =
    useRef(false);
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    if (allowSubmitRef.current) {
      allowSubmitRef.current = false;
      return;
    }

    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      allowSubmitRef.current = true;
      formRef.current?.requestSubmit();
    }, 1000);
  }

  return (
    <>
      <form
        ref={formRef}
        action={loginAction}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <input
          type="hidden"
          name="next"
          value={next}
        />

        <Field
          htmlFor="email"
          label={t("auth.login.emailLabel")}
        >
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </Field>

        <Field
          htmlFor="password"
          label={t("auth.login.passwordLabel")}
        >
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={8}
            autoComplete="current-password"
            hideLabel={t(
              "auth.login.hidePassword"
            )}
            showLabel={t(
              "auth.login.showPassword"
            )}
          />
        </Field>

        <SubmitButton />

        <div className="space-y-3 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
          >
            {t("auth.login.forgotPassword")}
          </Link>

          <p className="text-xs leading-5 text-muted-foreground">
            {t("auth.login.supportText")}
          </p>
        </div>
      </form>

      {isSubmitting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/98 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <Image
              src={SHEEP_SYMBOL_BLUE_PATH}
              alt=""
              aria-hidden="true"
              width={96}
              height={96}
              priority
              className="size-20 object-contain motion-safe:animate-spin motion-reduce:animate-none"
            />
            <p
              aria-live="polite"
              className="text-sm font-medium text-foreground"
            >
              {t("auth.login.loadingTitle")}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
