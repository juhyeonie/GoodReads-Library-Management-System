<?php
// Backend/create_test_user.php
require_once __DIR__ . '/config.php';

$email = 'test@example.com';
$password = 'password123'; // plain-text for test only
$plan = 'Basic';
$role = 'Customer'; // Changed to align with table data
$plan_status = 'Active'; // FIX 1: Changed from $status to $plan_status
$payment_method = 'Free Plan'; // FIX 2: Added payment method

try {
    // check exists
    $stmt = $pdo->prepare('SELECT AccountID FROM ACCOUNT WHERE Email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Test user already exists: $email";
        exit;
    }

    // FIX 3: Updated column names: Plan_Status, Payment_Method
    $ins = $pdo->prepare('INSERT INTO ACCOUNT (Email, Password, Plan, Role, Plan_Status, Payment_Method) VALUES (?, ?, ?, ?, ?, ?)');
    $ins->execute([$email, $password, $plan, $role, $plan_status, $payment_method]);
    echo "Inserted test user: $email with password: $password";
} catch (Exception $e) {
    echo "Error: " . htmlspecialchars($e->getMessage());
}