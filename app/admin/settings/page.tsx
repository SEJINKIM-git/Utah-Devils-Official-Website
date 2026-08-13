import { getSiteSettings } from "@/lib/site-content";
import AccountSettingsForm from "./AccountSettingsForm";
import SiteSettingsForm from "./SiteSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return <section style={{ maxWidth: 620 }}>
    <h1 className="wordmark" style={{ fontSize: 36 }}>ACCOUNT <span className="outline">SETTINGS</span></h1>
    <AccountSettingsForm />
    <SiteSettingsForm settings={settings} />
  </section>;
}
