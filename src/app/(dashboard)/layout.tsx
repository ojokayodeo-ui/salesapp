import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-60 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
