import Link from "next/link";
import { getSession, isOfficer } from "@/lib/auth";
import { getMember } from "@/lib/queries";
import { logoutAction } from "@/app/actions/auth";

export default async function Nav() {
  const session = await getSession();
  if (!session) return null;

  const member = await getMember(session.memberId);

  const links = [
    { href: "/", label: "홈" },
    { href: "/songs", label: "곡 신청" },
    { href: "/setlist", label: "셋리스트" },
    { href: "/members", label: "멤버" },
  ];
  if (isOfficer(session.role)) links.push({ href: "/admin", label: "관리" });

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-gray-700 hover:text-black">
            {l.label}
          </Link>
        ))}
        <span className="ml-auto text-gray-500">{member?.name ?? "멤버"}</span>
        <form action={logoutAction}>
          <button type="submit" className="text-gray-500 hover:text-black">
            로그아웃
          </button>
        </form>
      </nav>
    </header>
  );
}
