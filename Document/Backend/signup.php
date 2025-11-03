<?php
// Backend/signup.php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config.php';

function json_exit($code, $payload)
{
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$password = isset($_POST['password']) ? (string)$_POST['password'] : '';
$plan = isset($_POST['plan']) ? trim((string)$_POST['plan']) : 'Basic Plan';
$payment_method = isset($_POST['payment_method']) ? trim((string)$_POST['payment_method']) : '';

$errors = [];
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Enter a valid email.';
if ($password === '' || strlen($password) < 8) $errors['password'] = 'Password must be at least 8 characters.';
if (!empty($errors)) json_exit(400, ['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);

try {
    // Check existing
    $check = $pdo->prepare('SELECT AccountID FROM ACCOUNT WHERE Email = ? COLLATE NOCASE LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch()) {
        // Email exists
        json_exit(409, ['success' => false, 'message' => 'Email already registered.']);
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // --- FIXED DATE LOGIC ---
    $subs_started = null;
    $subs_end = null;

    if ($plan === 'Basic Plan') {
        if ($payment_method === '') $payment_method = 'Free Plan';
    } else {
        // Only set subscription dates if it's a paid plan
        $subs_started = date('Y-m-d H:i:s'); // Use full timestamp to match other files
        $subs_end = date('Y-m-d H:i:s', strtotime($subs_started . ' +30 days'));
    }
    // --- END FIXED DATE LOGIC ---

    $account_created = date('Y-m-d H:i:s');
    $role = 'Customer';
    $plan_status = 'Active';

    $stmt = $pdo->prepare(
        'INSERT INTO ACCOUNT (Email, Password, Plan, Role, SubsStarted, SubsEnd, Plan_Status, Payment_Method, AccountCreated) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $stmt->execute([$email, $passwordHash, $plan, $role, $subs_started, $subs_end, $plan_status, $payment_method, $account_created]);

    $account_id = $pdo->lastInsertId();

    echo json_encode(['success' => true, 'message' => 'Account created', 'account_id' => $account_id]);
    exit;
} catch (PDOException $e) {
    error_log('Signup error: ' . $e->getMessage());
    json_exit(500, ['success' => false, 'message' => 'Server error']);
}
