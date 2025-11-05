<?php
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Invalid method',405);
if (empty($currentUserId)) json_err('Not authenticated',401);

$uid = (int)$currentUserId;
$plan = trim($_POST['plan'] ?? '');
if (!$plan) json_err('Plan required.');

try {
    $u = $db->prepare('UPDATE ACCOUNT SET Plan = :plan, Plan_Status = :status, SubsStarted = :started, SubsEnd = :subs_end WHERE AccountID = :id');
    // you may want to compute SubsEnd based on plan period — here we clear expiry
    $u->execute([
        ':plan' => $plan,
        ':status' => 'Active',
        ':started' => date('Y-m-d H:i:s'),
        ':subs_end' => null,
        ':id' => $uid
    ]);

    json_ok(['message' => 'Plan changed', 'plan' => $plan]);
} catch (Exception $e) {
    json_err('Failed to change plan: ' . $e->getMessage(),500);
}
