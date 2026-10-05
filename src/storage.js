const DB_NAME = "labelproof-workspace-v2";
const STORE_NAMES = [
  "scans",
  "images",
  "assessments",
  "events",
  "settings",
  "drafts",
  "operations",
  "captureDrafts",
];
let database;
export function openDatabase() {
  if (database) return Promise.resolve(database);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      for (const name of STORE_NAMES)
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name, { keyPath: "id" });
    };
    request.onsuccess = () => {
      database = request.result;
      resolve(database);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Close other LabelProof tabs and retry."));
  });
}
export async function transact(names, mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(names, mode);
    const stores = Object.fromEntries(
      names.map((name) => [name, tx.objectStore(name)]),
    );
    let result;
    try {
      result = operation(stores);
    } catch (error) {
      tx.abort();
      reject(error);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("Storage transaction was aborted."));
  });
}
export async function list(name) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(name).objectStore(name).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function put(name, record) {
  return transact([name], "readwrite", (stores) => stores[name].put(record));
}
export async function get(name, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(name).objectStore(name).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export const defaults = {
  id: "preferences",
  workspaceName: "My label workspace",
  reviewerName: "Workspace reviewer",
  language: "eng",
  theme: "light",
  confidenceThreshold: 35,
};
export async function getSettings() {
  return { ...defaults, ...(await get("settings", "preferences")) };
}
export async function saveAssessment(scan, images, assessment, event) {
  if (await get("assessments", assessment.id))
    throw new Error("Existing assessment versions cannot be overwritten.");
  await transact(
    ["scans", "images", "assessments", "events"],
    "readwrite",
    (stores) => {
      stores.scans.put(scan);
      images.forEach((image) => stores.images.put(image));
      stores.assessments.add(assessment);
      stores.events.put(event);
    },
  );
}
export async function deleteScan(id) {
  const images = (await list("images")).filter((i) => i.scanId === id),
    assessments = (await list("assessments")).filter((a) => a.scanId === id),
    events = (await list("events")).filter((e) => e.scanId === id);
  await transact(
    ["scans", "images", "assessments", "events"],
    "readwrite",
    (stores) => {
      stores.scans.delete(id);
      images.forEach((i) => stores.images.delete(i.id));
      assessments.forEach((a) => stores.assessments.delete(a.id));
      events.forEach((e) => stores.events.delete(e.id));
    },
  );
}
export async function clearWorkspace() {
  await transact(STORE_NAMES, "readwrite", (stores) =>
    STORE_NAMES.forEach((name) => stores[name].clear()),
  );
}
export async function loadWorkspace() {
  const [scans, images, assessments, events, settings, drafts, operations] =
    await Promise.all([
      list("scans"),
      list("images"),
      list("assessments"),
      list("events"),
      getSettings(),
      list("drafts"),
      list("operations"),
    ]);
  return {
    scans: scans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    images,
    assessments,
    events: events.sort((a, b) => b.at.localeCompare(a.at)),
    settings,
    drafts,
    operations,
  };
}
