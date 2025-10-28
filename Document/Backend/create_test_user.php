<?php
// Backend/create_test_user.php
require_once __DIR__ . '/config.php';

$email = 'test@example.com';
$password = 'password123'; // plain-text for test only
$plan = 'Basic';
$role = 'User';
$status = 'Active';

try {
    // check exists
    $stmt = $pdo->prepare('SELECT AccountID FROM ACCOUNT WHERE Email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Test user already exists: $email";
        exit;
    }

    $ins = $pdo->prepare('INSERT INTO ACCOUNT (Email, Password, Plan, Role, Status) VALUES (?, ?, ?, ?, ?)');
    $ins->execute([$email, $password, $plan, $role, $status]);
    echo "Inserted test user: $email with password: $password";
} catch (Exception $e) {
    echo "Error: " . htmlspecialchars($e->getMessage());
}
