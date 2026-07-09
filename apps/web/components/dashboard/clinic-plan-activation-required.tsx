export function ClinicPlanActivationRequired() {
  return (
    <div className="rounded-2xl border border-dashed p-6">
      <h2 className="text-lg font-semibold">
        Operação aguardando ativação do plano
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A clínica já pode acessar a área de Administração, mas os módulos de
        operação serão liberados somente após o master da plataforma ativar o
        plano da clínica.
      </p>
    </div>
  );
}
