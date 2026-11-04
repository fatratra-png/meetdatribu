import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Versions « conscientes de la langue » de Link, useRouter, etc.
// <Link href="/astuces"> mène automatiquement à /fr/astuces ou /en/astuces.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
