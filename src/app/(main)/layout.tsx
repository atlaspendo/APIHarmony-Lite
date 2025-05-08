
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <AppSidebar />
        {/* Adjust pl-60 to pl-56 for slightly narrower sidebar if desired, or keep based on AppSidebar's w-60 */}
        <div className="flex flex-col sm:pl-60"> 
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
