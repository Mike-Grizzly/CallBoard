import type { Role } from "@/types/roles";

export const CAPABILITIES = [
  "productions:view",
  "productions:manage",
  "reports:view",
  "reports:create",
  "documents:view",
  "documents:upload",
  "announcements:view",
  "announcements:create",
  "activity:view",
  "settings:manage",
  "blocking:view",
  "blocking:edit",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const CAPABILITY_MAP: Record<Role, ReadonlySet<Capability>> = {
  admin: new Set<Capability>([
    "productions:view",
    "productions:manage",
    "reports:view",
    "reports:create",
    "documents:view",
    "documents:upload",
    "announcements:view",
    "announcements:create",
    "activity:view",
    "settings:manage",
    "blocking:view",
    "blocking:edit",
  ]),
  producer: new Set<Capability>([
    "productions:view",
    "productions:manage",
    "reports:view",
    "reports:create",
    "documents:view",
    "documents:upload",
    "announcements:view",
    "announcements:create",
    "activity:view",
    "blocking:view",
    "blocking:edit",
  ]),
  director: new Set<Capability>([
    "productions:view",
    "reports:view",
    "reports:create",
    "documents:view",
    "documents:upload",
    "announcements:view",
    "announcements:create",
    "activity:view",
    "blocking:view",
    "blocking:edit",
  ]),
  choreographer: new Set<Capability>([
    "productions:view",
    "reports:view",
    "reports:create",
    "documents:view",
    "documents:upload",
    "announcements:view",
    "activity:view",
    "blocking:view",
    "blocking:edit",
  ]),
  stage_manager: new Set<Capability>([
    "productions:view",
    "reports:view",
    "reports:create",
    "documents:view",
    "documents:upload",
    "announcements:view",
    "activity:view",
    "blocking:view",
    "blocking:edit",
  ]),
  cast: new Set<Capability>([
    "productions:view",
    "reports:view",
    "documents:view",
    "announcements:view",
    "blocking:view",
  ]),
  crew: new Set<Capability>([
    "productions:view",
    "reports:view",
    "documents:view",
    "announcements:view",
    "blocking:view",
  ]),
};

export function can(role: Role, capability: Capability): boolean {
  return CAPABILITY_MAP[role].has(capability);
}
