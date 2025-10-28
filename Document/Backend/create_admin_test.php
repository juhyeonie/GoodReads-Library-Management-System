<?php
// Backend/create_admin_test.php — run once for testing then delete
require_once __DIR__ . '/config.php';

$email = 'admin-test@example.com';
$plaintext = 'AdminPass123'; // use this to login
$hashed = password_hash($plaintext, PASSWORD_DEFAULT);
$plan = 'Premium'; // Admins often have premium access
$role = 'SuperAdmin'; // Changed to align with table data
$plan_status = 'Active'; // FIX 1: Changed from $status to $plan_status
$payment_method = 'N/A'; // FIX 2: Added payment method

try {
    // check exists
    $stmt = $pdo->prepare('SELECT AccountID FROM ACCOUNT WHERE Email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Test admin already exists: $email (password: $plaintext)";
        exit;
    }

    // FIX 3: Updated column names: Plan_Status, Payment_Method
    $ins = $pdo->prepare('INSERT INTO ACCOUNT (Email, Password, Plan, Role, Plan_Status, Payment_Method) VALUES (?, ?, ?, ?, ?, ?)');
    $ins->execute([$email, $hashed, $plan, $role, $plan_status, $payment_method]);

    echo "Inserted test admin: $email with password: $plaintext";
} catch (Exception $e) {
    echo "Error: " . htmlspecialchars($e->getMessage());
}