import { getDB } from "./client";

export function logAdminAction(
  adminFingerprint: string,
  action: string,
  targetAccountId: string | null,
  payload: any
) {
  const db = getDB();
  const createdAt = new Date().toISOString();
  db.query(`
    INSERT INTO admin_audit_log (admin_fingerprint, action, target_account_id, payload_json, created_at)
    VALUES ($fingerprint, $action, $targetId, $payloadJson, $createdAt)
  `).run({
    $fingerprint: adminFingerprint,
    $action: action,
    $targetId: targetAccountId,
    $payloadJson: JSON.stringify(payload),
    $createdAt: createdAt
  });
}

export function logChatMessage(
  senderAccountId: string | null,
  senderName: string | null,
  message: string,
  scope: string, // e.g. 'global' or 'local' or 'whisper:username'
  roomId: string | null
) {
  const db = getDB();
  const createdAt = new Date().toISOString();
  db.query(`
    INSERT INTO chat_log (sender_account_id, sender_name, message, scope, room_id, created_at)
    VALUES ($senderId, $senderName, $message, $scope, $roomId, $createdAt)
  `).run({
    $senderId: senderAccountId,
    $senderName: senderName,
    $message: message,
    $scope: scope,
    $roomId: roomId,
    $createdAt: createdAt
  });
}

export function getRecentChatLogs(limit: number = 50) {
  const db = getDB();
  return db.query(`
    SELECT sender_name, message, scope, room_id, created_at
    FROM chat_log
    WHERE scope IN ('local', 'global')
      AND sender_name NOT IN ('[SYSTEM]', 'System', 'SERVER')
      AND message NOT LIKE '%restarting%'
      AND message NOT LIKE '%shutting down%'
      AND message NOT LIKE '%maintenance%'
    ORDER BY id DESC
    LIMIT $limit
  `).all({ $limit: limit }) as Array<{
    sender_name: string | null;
    message: string;
    scope: string;
    room_id: string | null;
    created_at: string;
  }>;
}
