import { isEditModeActive } from "@/lib/edit-mode.server";
import EditableImageClient, { type EditableImageProps } from "./EditableImageClient";

export default async function EditableImage(props: EditableImageProps) {
  if (!(await isEditModeActive())) return <>{props.children}</>;
  return <EditableImageClient {...props} />;
}
