import { isEditModeActive } from "@/lib/edit-mode.server";
import EditableFieldClient, { type EditableFieldProps } from "./EditableFieldClient";

export default async function EditableField(props: EditableFieldProps) {
  if (await isEditModeActive()) return <EditableFieldClient {...props} />;
  if (!props.wrapperClassName) return <>{props.children}</>;
  return props.value ? <div className={props.wrapperClassName}>{props.children}</div> : null;
}
