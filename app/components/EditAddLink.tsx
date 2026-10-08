import { isEditModeActive } from "@/lib/edit-mode.server";
import EditAddLinkClient from "./EditAddLinkClient";

export default async function EditAddLink(props: { href: string; label: string }) {
  if (!(await isEditModeActive())) return null;
  return <EditAddLinkClient {...props} />;
}
