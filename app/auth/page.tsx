import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import Login from "./login"; // Your client login component
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function AuthPage() {
const cookieStore = await cookies();
const token = cookieStore.get("accessToken")?.value;


  if (token) {
    try {
      const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(token, SECRET);

      // If token valid, redirect to /study
      redirect("/study");
    } catch {
      // Invalid token, show login page
    }
  }

  return (
    <Suspense fallback={<div className="text-center text-gray-500 py-8">Loading authorization...</div>}>
      <Login />
    </Suspense>
  );
}
