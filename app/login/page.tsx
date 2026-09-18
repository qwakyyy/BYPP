import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto mt-10 max-w-sm rounded border bg-white p-6">
      <h1 className="mb-4 text-lg font-semibold">로그인</h1>
      <p className="mb-4 text-sm text-gray-500">
        이미 등록된 이름이면 이름만 입력하면 돼요. 처음이면 악기와 초대코드도 입력해주세요.
      </p>
      <LoginForm />
    </div>
  );
}
