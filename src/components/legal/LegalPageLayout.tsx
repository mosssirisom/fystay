export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: {lastUpdated}</p>
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}
