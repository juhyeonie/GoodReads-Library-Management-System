<?php
// Backend/create_admin_test.php — run once for testing then delete
require_once __DIR__ . '/config.php';

$email = 'admin-test@example.com';
$plaintext = 'AdminPass123'; // use this to login
$hashed = password_hash($plaintext, PASSWORD_DEFAULT);
$plan = 'Basic';
$role = 'Admin';
$status = 'Active';

try {
    // check exists
    $stmt = $pdo->prepare('SELECT AccountID FROM ACCOUNT WHERE Email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Test admin already exists: $email (password: $plaintext)";
        exit;
    }

    $ins = $pdo->prepare('INSERT INTO ACCOUNT (Email, Password, Plan, Role, Status) VALUES (?, ?, ?, ?, ?)');
    $ins->execute([$email, $hashed, $plan, $role, $status]);

    echo "Inserted test admin: $email with password: $plaintext";
} catch (Exception $e) {
    echo "Error: " . htmlspecialchars($e->getMessage());
}
