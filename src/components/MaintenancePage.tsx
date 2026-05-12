const MaintenancePage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-6 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200">
          Neura ERP
        </span>
        <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
          Sistema en mantenimiento
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
          Estamos realizando mejoras en la plataforma. El acceso volvera a estar
          disponible en breve.
        </p>
      </section>
    </main>
  );
};

export default MaintenancePage;
