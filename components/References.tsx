import type { Reference } from "@/lib/types";

/**
 * The bibliography. Order here IS the citation numbering in the prose — the
 * markdown pipeline derives [n] from each entry's index, so the two can never
 * disagree.
 */
export default function References({ references }: { references: Reference[] }) {
  if (references.length === 0) return null;

  return (
    <section className="references" aria-labelledby="references-heading">
      <h2 id="references-heading">References</h2>
      <ol>
        {references.map((ref) => (
          <li key={ref.id} id={`ref-${ref.id}`}>
            <div>
              <span>{ref.authors}</span>
              {ref.year ? <span> ({ref.year}). </span> : <span>. </span>}
              <span className="ref-title">
                {ref.url ? (
                  <a href={ref.url} target="_blank" rel="noopener noreferrer">
                    {ref.title}
                  </a>
                ) : (
                  ref.title
                )}
              </span>
              {ref.venue && <span>. {ref.venue}</span>}
              <span>.</span>
              {ref.note && <span className="ref-note">{ref.note}</span>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
