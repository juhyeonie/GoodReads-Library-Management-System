<?php
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Invalid method',405);
if (empty($currentUserId)) json_err('Not authenticated',401);

$uid = (int)$currentUserId;
$current = trim($_POST['current_email'] ?? '');
$new = trim($_POST['new_email'] ?? '');

if (!$current || !$new) json_err('Both current and new email are required.');
if (!filter_var($new, FILTER_VALIDATE_EMAIL)) json_err('New email is invalid.');
if (!filter_var($current, FILTER_VALIDATE_EMAIL)) json_err('Current email is invalid.');

try {
    // verify current email
    $s = $db->prepare('SELECT Email FROM ACCOUNT WHERE AccountID = :id');
    $s->execute([':id' => $uid]);
    $r = $s->fetch(PDO::FETCH_ASSOC);
    if (!$r) json_err('User not found',404);
    if (strtolower($r['Email']) !== strtolower($current)) json_err('Current email does not match our records.');

    // ensure new not taken
    $s2 = $db->prepare('SELECT AccountID FROM ACCOUNT WHERE lower(Email) = lower(:email) AND AccountID <> :id');
    $s2->execute([':email' => $new, ':id' => $uid]);
    if ($s2->fetch()) json_err('Email already in use.');

    $u = $db->prepare('UPDATE ACCOUNT SET Email = :email WHERE AccountID = :id');
    $u->execute([':email' => $new, ':id' => $uid]);

    json_ok(['message'=>'Email updated','email'=>$new]);
} catch (Exception $e) {
    json_err('Update failed: ' . $e->getMessage(),500);
}
