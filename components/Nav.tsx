import Link from "next/link";
import { getSession } from "@/lib/auth";
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
  if (session.isAdmin) links.push({ href: "/admin", label: "관리" });

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-gray-700 hover:text-black">
            {l.label}
          </Link>
        ))}
        <a
          href="https://docs.google.com/spreadsheets/d/1Qw4QUHZOvUy5Fyu3cOQ6Am59oMNeGn7OzWB_jyud-M8"
          target="_blank"
          rel="noreferrer"
          className="text-gray-700 hover:text-black"
        >
          얼방 대관
        </a>
        <a
          href="https://drive.google.com/drive/folders/1gCvTrfbjRu13hMe4hUbRdiBKypelmRPd"
          target="_blank"
          rel="noreferrer"
          className="text-gray-700 hover:text-black"
        >
          악보 아카이브
        </a>
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
