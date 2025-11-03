<?php
// Backend/signup.php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success'=>false,'message'=>'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config.php';

function json_exit($code,$payload){ http_response_code($code); echo json_encode($payload); exit; }

$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$password = isset($_POST['password']) ? (string)$_POST['password'] : '';
// UPDATED: Default plan is now "Basic Plan"
$plan = isset($_POST['plan']) ? trim((string)$_POST['plan']) : 'Basic Plan';
$subs_started = isset($_POST['subs_started']) ? trim((string)$_POST['subs_started']) : null;
$subs_end = isset($_POST['subs_end']) ? trim((string)$_POST['subs_end']) : null;
$payment_method = isset($_POST['payment_method']) ? trim((string)$_POST['payment_method']) : ''; // New column

$errors = [];
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email']='Enter a valid email.';
if ($password === '' || strlen($password) < 8) $errors['password']='Password must be at least 8 characters.';
if (!empty($errors)) json_exit(400,['success'=>false,'message'=>'Validation failed.','errors'=>$errors]);

try {
    // Check existing
    $check = $pdo->prepare('SELECT AccountID FROM ACCOUNT WHERE Email = ? COLLATE NOCASE LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch()) {
        // Email exists — signal conflict (client can redirect to signin)
        json_exit(409,['success'=>false,'message'=>'Email already registered.']);
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // If subs dates not provided, set default: start = today, end = +30 days
    // Note: SubsStarted/SubsEnd are Y-m-d here, which might conflict if the DB format is Y-m-d H:i:s.
    // However, keeping existing date logic and only updating the new column:
    if (!$subs_started) $subs_started = date('Y-m-d');
    if (!$subs_end) $subs_end = date('Y-m-d', strtotime($subs_started.' +30 days'));
    
    // UPDATED: Check for "Basic Plan"
    if ($payment_method === '' && $plan === 'Basic Plan') $payment_method = 'Free Plan';

    // *** START CHANGE: Define the creation date ***
    $account_created = date('Y-m-d H:i:s');
    // *** END CHANGE ***


    // FIX 1: Updated column names for INSERT (Plan_Status, Payment_Method)
    // The query now includes 'Payment_Method' and uses 'Plan_Status'
    // *** START CHANGE: Update the prepared statement ***
    $stmt = $pdo->prepare('INSERT INTO ACCOUNT (Email, Password, Plan, Role, SubsStarted, SubsEnd, Plan_Status, Payment_Method, AccountCreated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    // *** END CHANGE ***
    
    $role = 'Customer'; // Changed to align with your new table data
    $plan_status = 'Active';
    // FIX 2: Execute now has 8 parameters
    // *** START CHANGE: Update the execute array ***
    $stmt->execute([$email, $passwordHash, $plan, $role, $subs_started, $subs_end, $plan_status, $payment_method, $account_created]);
    // *** END CHANGE ***

    $account_id = $pdo->lastInsertId();

    echo json_encode(['success'=>true,'message'=>'Account created','account_id'=>$account_id]);
    exit;

} catch (PDOException $e) {
    error_log('Signup error: '.$e->getMessage());
    json_exit(500,['success'=>false,'message'=>'Server error']);
}
