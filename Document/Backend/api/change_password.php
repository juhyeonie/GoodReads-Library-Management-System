<?php
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Invalid method',405);
if (empty($currentUserId)) json_err('Not authenticated',401);

$uid = (int)$currentUserId;
$current = $_POST['current_password'] ?? '';
$new = $_POST['new_password'] ?? '';
$re = $_POST['retype_password'] ?? '';

if (!$current || !$new || !$re) json_err('All fields are required.');
if ($new !== $re) json_err('New passwords do not match.');
if (strlen($new) < 6) json_err('Password must be at least 6 characters.');

try {
    $s = $db->prepare('SELECT Password FROM ACCOUNT WHERE AccountID = :id');
    $s->execute([':id' => $uid]);
    $row = $s->fetch(PDO::FETCH_ASSOC);
    if (!$row) json_err('User not found',404);

    $stored = $row['Password'];

    // if stored looks like a hash, use password_verify
    if (password_needs_rehash($stored, PASSWORD_DEFAULT) || strpos($stored, '$') === 0) {
        if (!password_verify($current, $stored)) json_err('Current password incorrect.');
        $hash = password_hash($new, PASSWORD_DEFAULT);
    } else {
        // fallback: stored may be plaintext — compare directly (not recommended)
        if ($current !== $stored) json_err('Current password incorrect.');
        $hash = password_hash($new, PASSWORD_DEFAULT);
    }

    $u = $db->prepare('UPDATE ACCOUNT SET Password = :hash WHERE AccountID = :id');
    $u->execute([':hash' => $hash, ':id' => $uid]);

    json_ok(['message'=>'Password updated']);
} catch (Exception $e) {
    json_err('Failed: ' . $e->getMessage(),500);
}
