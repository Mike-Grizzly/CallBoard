import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getAllNotesForUser, getNoteTagsByOrg } from "@/features/notes/queries";
import {
  resolveProductionColorToken,
  colorVarForToken,
} from "@/features/productions/constants";
import { NotesFeed, type FeedNote } from "./notes-feed";

/**
 * Workspace-level notes feed — every note the user authored across
 * every production they belong to, newest-first. Tapping a card
 * deep-links into that production's notes editor with the note
 * pre-selected (via `?id=`).
 */
export default async function NotesFeedPage() {
  const user = await requireCurrentUser();
  if (!can(user.role, "notes:view")) redirect("/dashboard");

  const manageAll = can(user.role, "productions:manage");

  const [notesRaw, tags] = await Promise.all([
    getAllNotesForUser(user.id, user.organizationId, { manageAll }),
    getNoteTagsByOrg(user.organizationId, user.id),
  ]);

  // Sort newest-first by createdAt (user's intent: "in the order the
  // user entered them, latest first") and serialize for the client.
  const notes: FeedNote[] = notesRaw
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((n) => {
      const token = resolveProductionColorToken({
        id: n.productionId,
        color: n.productionColor,
      });
      return {
        id: n.id,
        productionId: n.productionId,
        productionTitle: n.productionTitle,
        productionSlug: n.productionSlug,
        productionColorVar: colorVarForToken(token),
        title: n.title,
        content: n.content,
        isTodo: n.isTodo,
        isCompleted: n.isCompleted,
        isPinned: n.isPinned,
        tagId: n.tagId,
        dueDate: n.dueDate,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      };
    });

  return <NotesFeed notes={notes} tags={tags} />;
}
