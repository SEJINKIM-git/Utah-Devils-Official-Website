import type { Metadata } from "next";
import AdminNav from "./AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <AdminNav />
      {children}
    </div>
  );
}
