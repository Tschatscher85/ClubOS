interface TextSektionProps {
  id: string;
  titel?: string | null;
  inhalt?: string | null;
  primaryColor: string;
}

export function TextSektion({ id, titel, inhalt, primaryColor }: TextSektionProps) {
  if (!inhalt && !titel) return null;

  return (
    <section id={`sektion-${id}`} className="py-16">
      <div className="mx-auto max-w-4xl px-4">
        {titel && (
          <h2
            className="mb-8 text-center text-3xl font-bold"
            style={{ color: primaryColor }}
          >
            {titel}
          </h2>
        )}
        {inhalt && (
          <div
            className="prose prose-lg mx-auto max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: inhalt }}
          />
        )}
      </div>
    </section>
  );
}
