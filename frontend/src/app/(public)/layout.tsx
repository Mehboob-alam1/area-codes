import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { apiGet } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let maintenance = false;
  let name = "World Area Code Directory";
  try {
    const settings = await apiGet<{ success: boolean; data: { maintenanceMode: boolean; websiteName: string } }>("/settings");
    maintenance = settings.data.maintenanceMode;
    name = settings.data.websiteName || name;
  } catch {
    maintenance = false;
  }

  if (maintenance) {
    return (
      <main id="content" className="grid flex-1 place-items-center px-4 py-24">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-semibold">{name} is briefly offline</h1>
          <p className="mt-3 text-muted">Public pages are hidden while maintenance mode is on. Administrators can still sign in.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Header />
      <div id="content" className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
