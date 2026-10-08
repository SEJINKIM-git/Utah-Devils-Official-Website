import { isEditModeActive } from "@/lib/edit-mode.server";
import EditableEventPhotosClient, { type EditableEventPhotosProps } from "./EditableEventPhotosClient";

export default async function EditableEventPhotos(props: EditableEventPhotosProps) {
  if (!(await isEditModeActive())) return null;
  return <EditableEventPhotosClient {...props} />;
}
