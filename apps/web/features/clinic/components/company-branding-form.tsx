"use client";

import type { ChangeEvent } from "react";
import { useRef, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import {
  FEEDBACK_WARNING_MESSAGES,
  getFeedbackErrorMessage,
} from "@/lib/feedback";

import { updateClinicBrandingAction } from "../actions/update-clinic-branding";
import {
  MAX_BRANDING_LOGO_FILE_SIZE_BYTES,
  MAX_BRANDING_NAME_LENGTH,
} from "../services/clinic-formats";

type Props = {
  brandName: string | null;
  logoUrl: string | null;
};

type FormValues = {
  brandName: string;
  logoUrl: string;
};

export function CompanyBrandingForm({
  brandName,
  logoUrl,
}: Props) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] =
    useTransition();
  const form = useForm<FormValues>({
    defaultValues: {
      brandName: brandName ?? "",
      logoUrl: logoUrl ?? "",
    },
  });
  const logoPreview =
    useWatch({
      control: form.control,
      name: "logoUrl",
    }) || "";

  function handleLogoFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.type !== "image/png" &&
      file.type !== "image/svg+xml"
    ) {
      toast.warning(
        FEEDBACK_WARNING_MESSAGES.unsupportedImageFormat
      );
      return;
    }

    if (
      file.size >
      MAX_BRANDING_LOGO_FILE_SIZE_BYTES
    ) {
      toast.warning(
        FEEDBACK_WARNING_MESSAGES.oversizedImage
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      form.setValue(
        "logoUrl",
        typeof reader.result ===
          "string"
          ? reader.result
          : "",
        {
          shouldDirty: true,
        }
      );
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    form.setValue("logoUrl", "", {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function submit(values: FormValues) {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set(
          "brandName",
          values.brandName
        );
        formData.set(
          "logoUrl",
          values.logoUrl
        );
        await updateClinicBrandingAction(
          formData
        );
        toast.success(
          "Identidade da empresa atualizada com sucesso."
        );
      } catch (error) {
        toast.error(
          getFeedbackErrorMessage(
            error,
            "Não foi possível atualizar a identidade da empresa."
          )
        );
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="grid gap-5"
    >
      <label className="field-stack">
        <span className="field-label">
          Nome de exibição
        </span>
        <Input
          placeholder="Como a empresa deve aparecer no sistema"
          maxLength={MAX_BRANDING_NAME_LENGTH}
          {...form.register("brandName")}
        />
        <span className="field-help">
          Ate {MAX_BRANDING_NAME_LENGTH} caracteres.
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <FormSection
          title="Identidade visual"
          description="Atualize a apresentação local da empresa sem alterar dados fiscais ou contratuais."
        >

          <label className="field-stack">
            <span className="field-label">
              Logo da empresa
            </span>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".svg,.png,image/svg+xml,image/png"
              onChange={handleLogoFileChange}
            />
            <span className="field-help">
              Formatos aceitos: SVG e PNG ate 256 KB.
            </span>
          </label>

          <label className="field-stack">
            <span className="field-label">
              Logo por URL/caminho
            </span>
            <Input
              placeholder="Cole um caminho interno ou base64"
              {...form.register("logoUrl")}
            />
          </label>

          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={clearLogo}
            >
              Remover logo
            </Button>
          </div>
        </FormSection>

        <FormSection>
          <span className="field-label">
            Pré-visualização
          </span>
          <div className="flex min-h-52 items-center justify-center rounded-[1rem] border border-border/70 bg-background/85 p-4">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Logo da empresa"
                className="max-h-28 max-w-full object-contain"
              />
            ) : (
              <p className="text-center text-xs leading-5 text-muted-foreground">
                O logo da empresa aparecerá aqui.
              </p>
            )}
          </div>
        </FormSection>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
        >
          Salvar identidade
        </Button>
      </div>
    </form>
  );
}
