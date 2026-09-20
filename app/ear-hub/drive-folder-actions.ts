import { GOOGLE_APP_ID, GOOGLE_PICKER_API_KEY, loadDrivePickerApi, type DriveFolderSelection } from "./drive";

const FOLDER_MIME = "application/vnd.google-apps.folder";

type PickerDoc = { id?: string; name?: string; mimeType?: string; type?: string };
type PickerResponse = { action?: string; docs?: PickerDoc[] };
type FolderView = {
  setIncludeFolders: (enabled: boolean) => FolderView;
  setSelectFolderEnabled: (enabled: boolean) => FolderView;
  setMode: (mode: string) => FolderView;
  setParent: (id: string) => FolderView;
};
type PickerBuilder = {
  addView: (view: FolderView) => PickerBuilder;
  setOAuthToken: (token: string) => PickerBuilder;
  setDeveloperKey: (key: string) => PickerBuilder;
  setAppId: (appId: string) => PickerBuilder;
  setOrigin: (origin: string) => PickerBuilder;
  setTitle: (title: string) => PickerBuilder;
  setCallback: (callback: (data: PickerResponse) => void) => PickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
};
type PickerApi = {
  picker: {
    Action: { PICKED: string };
    ViewId: { DOCS: string };
    DocsViewMode: { LIST: string };
    DocsView: new (id: string) => FolderView;
    PickerBuilder: new () => PickerBuilder;
  };
};

/** Drive Pickerは表示用。ファイルも見せるが、保存先として選択できるのはフォルダだけ。 */
export async function openReadableFolderPicker(
  token: string,
  onPicked: (folder: DriveFolderSelection) => void,
  onInvalidSelection: () => void,
) {
  if (!GOOGLE_PICKER_API_KEY || typeof window === "undefined") return false;
  if (!(await loadDrivePickerApi())) return false;
  const google = (window as unknown as { google?: PickerApi }).google;
  if (!google?.picker) return false;

  const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(true)
    // setMimeTypes(FOLDER_MIME) は既存ファイルを隠してしまうため付けない。
    .setMode(google.picker.DocsViewMode.LIST)
    .setParent("root");

  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    .setDeveloperKey(GOOGLE_PICKER_API_KEY)
    .setAppId(GOOGLE_APP_ID)
    .setOrigin(window.location.origin)
    .setTitle("保存先フォルダを選ぶ")
    .setCallback((data) => {
      if (data.action !== google.picker.Action.PICKED) return;
      const selected = data.docs?.[0];
      if (!selected?.id) return;
      // ファイルも閲覧できるが、ファイルそのものを親フォルダとして保存しない。
      if ((selected.mimeType ?? selected.type) !== FOLDER_MIME) {
        onInvalidSelection();
        return;
      }
      onPicked({ id: selected.id, name: selected.name || "選択したフォルダ" });
    })
    .build();
  picker.setVisible(true);
  return true;
}

/** drive.fileの範囲で、マイドライブ直下またはPickerで選択済みのフォルダ内に新規フォルダを作る。 */
export async function createDriveFolder(
  token: string,
  name: string,
  parentId: string,
): Promise<DriveFolderSelection> {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 255) throw new Error("invalid-name");
  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: trimmedName,
      mimeType: FOLDER_MIME,
      parents: [parentId || "root"],
    }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("needs-login");
    if (response.status === 403 || response.status === 404) throw new Error("parent-not-accessible");
    throw new Error(`create-failed-${response.status}`);
  }
  const result = (await response.json()) as { id?: string; name?: string; mimeType?: string };
  if (!result.id || result.mimeType !== FOLDER_MIME) throw new Error("invalid-response");
  return { id: result.id, name: result.name || trimmedName };
}
