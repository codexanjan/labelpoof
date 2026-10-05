import {
  createIcons,
  ScanLine,
  LayoutDashboard,
  Scan,
  BookOpen,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  ArrowRight,
  CheckCheck,
  CircleCheck,
  Focus,
  BadgeCheck,
  PackageSearch,
  EyeOff,
  CameraOff,
  CircleAlert,
  LockKeyhole,
  FlaskConical,
  Lock,
  Sparkles,
  Lightbulb,
  Circle,
  Info,
  Check,
  Images,
  PencilLine,
  ExternalLink,
  ScanSearch,
  Image,
  Camera,
  Download,
  Printer,
  X,
  Package,
  FileCheck,
  Leaf,
  Scale,
  Search,
  Bell,
  Settings,
  ChartNoAxesCombined,
  Files,
  ListChecks,
  GalleryHorizontalEnd,
  Menu,
  ChevronRight,
  ChevronDown,
  Upload,
  Trash2,
  RotateCcw,
  Clock,
  History,
  HardDrive,
  SlidersHorizontal,
  Save,
  Copy,
  ZoomIn,
  ZoomOut,
  Move,
  FileJson,
  Database,
  FileText,
  PanelLeftClose,
  Ellipsis,
  CircleHelp,
  CheckCircle2,
} from "lucide";
const icons = {
  ScanLine,
  LayoutDashboard,
  Scan,
  BookOpen,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  ArrowRight,
  CheckCheck,
  CircleCheck,
  Focus,
  BadgeCheck,
  PackageSearch,
  EyeOff,
  CameraOff,
  CircleAlert,
  LockKeyhole,
  FlaskConical,
  Lock,
  Sparkles,
  Lightbulb,
  Circle,
  Info,
  Check,
  Images,
  PencilLine,
  ExternalLink,
  ScanSearch,
  Image,
  Camera,
  Download,
  Printer,
  X,
  Package,
  FileCheck,
  Leaf,
  Scale,
  Search,
  Bell,
  Settings,
  ChartNoAxesCombined,
  Files,
  ListChecks,
  GalleryHorizontalEnd,
  Menu,
  ChevronRight,
  ChevronDown,
  Upload,
  Trash2,
  RotateCcw,
  Clock,
  History,
  HardDrive,
  SlidersHorizontal,
  Save,
  Copy,
  ZoomIn,
  ZoomOut,
  Move,
  FileJson,
  Database,
  FileText,
  PanelLeftClose,
  Ellipsis,
  CircleHelp,
  CheckCircle2,
};
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const icon = (name) =>
  `<i data-lucide="${name}" aria-hidden="true"></i>`;
export const hydrateIcons = () => createIcons({ icons });
export function date(value, time = false) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
export function heading(eyebrow, title, description, action = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="heading-actions">${action}</div></div>`;
}
export function empty(title, description, action = "") {
  return `<div class="empty-row"><div class="empty-symbol">${icon("package-search")}</div><div><h3>${esc(title)}</h3><p>${esc(description)}</p></div>${action}</div>`;
}
export const newButton = `<button class="primary" data-action="new">${icon("plus")} New product scan</button>`;
export function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 4500);
}
export function download(content, name, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
