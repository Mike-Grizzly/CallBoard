import { db } from "@/db";
import { sql } from "drizzle-orm";

export type PinRow = {
  pinId: string;
  itemType: string;
  itemId: string;
  pinnedAt: Date;
  title: string;
  subtype: string;
  productionTitle: string;
  productionId: string;
  productionSlug: string;
  itemUpdatedAt: Date;
};

export async function getPinsForUser(userId: string): Promise<PinRow[]> {
  const result = await db.execute(sql`
    SELECT
      up.id           AS "pinId",
      up.item_type    AS "itemType",
      up.item_id      AS "itemId",
      up.created_at   AS "pinnedAt",
      d.title         AS title,
      d.document_type AS subtype,
      p.title         AS "productionTitle",
      p.id            AS "productionId",
      p.slug          AS "productionSlug",
      d.created_at    AS "itemUpdatedAt"
    FROM user_pins up
    JOIN documents d ON up.item_id = d.id AND up.item_type = 'document'
      AND d.deleted_at IS NULL
    JOIN productions p ON d.production_id = p.id
    WHERE up.user_id = ${userId}

    UNION ALL

    SELECT
      up.id,
      up.item_type,
      up.item_id,
      up.created_at,
      CONCAT('Report #', r.report_number::text) AS title,
      'report'                                   AS subtype,
      p.title,
      p.id,
      p.slug,
      COALESCE(r.updated_at, r.created_at)       AS "itemUpdatedAt"
    FROM user_pins up
    JOIN rehearsal_reports r ON up.item_id = r.id AND up.item_type = 'report'
      AND r.deleted_at IS NULL
    JOIN productions p ON r.production_id = p.id
    WHERE up.user_id = ${userId}

    UNION ALL

    SELECT
      up.id,
      up.item_type,
      up.item_id,
      up.created_at,
      COALESCE(NULLIF(n.title, ''), 'Untitled note') AS title,
      CASE WHEN n.is_todo THEN 'todo' ELSE 'note' END AS subtype,
      p.title,
      p.id,
      p.slug,
      n.updated_at
    FROM user_pins up
    JOIN production_notes n ON up.item_id = n.id AND up.item_type = 'note'
    JOIN productions p ON n.production_id = p.id
    WHERE up.user_id = ${userId}

    ORDER BY "pinnedAt" DESC
  `);

  return result.rows as PinRow[];
}
