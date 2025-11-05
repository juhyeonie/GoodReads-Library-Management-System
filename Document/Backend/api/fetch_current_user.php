<?php
require __DIR__ . '/_bootstrap.php';

if (empty($currentUserId)) json_err('Not authenticated',401);
$uid = (int) $currentUserId;

try {
    // Use your ACCOUNT table and column names
    $stmt = $db->prepare('SELECT AccountID, Email, Role, Plan, Plan_Status, SubsStarted, SubsEnd FROM ACCOUNT WHERE AccountID = :id');
    $stmt->execute([':id' => $uid]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) json_err('User not found',404);

    // Normalize keys expected by client
    $out = [
      'id' => $user['AccountID'],
      'email' => $user['Email'],
      'role' => $user['Role'] ?? '',
      'plan' => $user['Plan'] ?? '',
      'plan_status' => $user['Plan_Status'] ?? '',
      'subs_started' => $user['SubsStarted'] ?? null,
      'subs_end' => $user['SubsEnd'] ?? null,
      'status' => $user['Status'] ?? ''
    ];

    json_ok(['user' => $out]);
} catch (Exception $e) {
    json_err('Fetch failed: ' . $e->getMessage(),500);
}
