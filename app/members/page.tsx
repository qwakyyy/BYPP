import { getAllMembers } from "@/lib/queries";
import { ROLE_LABEL } from "@/lib/types";

export default async function MembersPage() {
  const members = await getAllMembers();

  const byGeneration = new Map<number, typeof members>();
  for (const member of members) {
    const list = byGeneration.get(member.generation) ?? [];
    list.push(member);
    byGeneration.set(member.generation, list);
  }
  const generations = [...byGeneration.keys()].sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">멤버 명단</h1>

      {generations.length === 0 && <p className="text-sm text-gray-500">아직 멤버가 없어요.</p>}

      {generations.map((gen) => {
        const list = byGeneration.get(gen)!;
        const highlighted = list.filter((m) => m.role !== "member" || m.is_admin);
        const regular = list.filter((m) => m.role === "member" && !m.is_admin);

        return (
          <section key={gen} className="rounded border bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">{gen}기</h2>

            {highlighted.length > 0 && (
              <ul className="mb-3 flex flex-col gap-1">
                {highlighted.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    {m.role !== "member" && (
                      <span className="rounded bg-gray-900 px-2 py-0.5 text-xs text-white">
                        {ROLE_LABEL[m.role]}
                      </span>
                    )}
                    {m.is_admin && (
                      <span className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
                        관리자
                      </span>
                    )}
                    <span className="font-medium">{m.name}</span>
                    {m.instrument && <span className="text-gray-500">{m.instrument}</span>}
                  </li>
                ))}
              </ul>
            )}

            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {regular.map((m) => (
                <li key={m.id} className="text-sm text-gray-700">
                  {m.name}
                  {m.instrument && <span className="text-gray-500"> ({m.instrument})</span>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
