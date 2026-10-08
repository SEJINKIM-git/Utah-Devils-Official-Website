import { isEditModeActive } from "@/lib/edit-mode.server";
import EditableClient, { type EditableProps } from "./EditableClient";

export default async function Editable(props: EditableProps) {
  if (!(await isEditModeActive())) return <>{props.children}</>;
  return <EditableClient {...props} />;
}
