<?php
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Invalid method',405);
if (empty($currentUserId)) json_err('Not authenticated',401);

$uid = (int)$currentUserId;

try {
    $db->beginTransaction();

    // mark account as cancelled/expired
    $stmt = $db->prepare('UPDATE ACCOUNT SET Plan_Status = :plan_status, Status = :status, SubsEnd = :subs_end WHERE AccountID = :id');
    $stmt->execute([
        ':plan_status' => 'Expired',
        ':status' => 'Cancelled',
        ':subs_end' => date('Y-m-d H:i:s'),
        ':id' => $uid
    ]);

    $db->commit();
    json_ok(['message' => 'Membership cancelled']);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    json_err('Failed to cancel: ' . $e->getMessage(),500);
}
