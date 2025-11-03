<?php
// Backend/user_add.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once __DIR__ . '/config.php'; 

$adminId = $_SESSION['user']['AccountID'] ?? 0;

// Get data from POST request (sent as JSON from JS)
$input = json_decode(file_get_contents('php://input'), true);

$email = $input['email'] ?? '';
$password = $input['password'] ?? '';
$plan = $input['plan'] ?? ''; // Expecting 'Basic Plan', 'Standard Plan', etc.
$payment = $input['payment'] ?? '';

// --- Validation ---
$errors = [];
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $errors['email'] = 'Invalid email format.'; }
if (strlen($password) < 6) { $errors['password'] = 'Password must be at least 6 characters.'; }
if (empty($plan)) { $errors['plan'] = 'Plan is required.'; }
// Add more checks if needed (e.g., valid plan names, payment methods)

// Check if email already exists
try {
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM ACCOUNT WHERE Email = ? COLLATE NOCASE");
    $checkStmt->execute([$email]);
    if ($checkStmt->fetchColumn() > 0) {
        $errors['email'] = 'Email already registered.';
    }
} catch (PDOException $e) {
    // Handle potential DB error during check
    error_log("Email check error: " . $e->getMessage());
    $errors['database'] = 'Error checking email.';
}


if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}
// --- End Validation ---

try {
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Set default status and role
    $role = 'Customer';
    $plan_status = 'Active'; 
    // Determine SubsStart/End if needed based on plan (e.g., set for Standard/Premium)
    $subs_started = null;
    $subs_end = null;
    if ($plan !== 'Basic Plan') {
        $subs_started = date('Y-m-d H:i:s');
        $subs_end = date('Y-m-d H:i:s', strtotime('+30 days'));
    }

    // *** START CHANGE: Define the creation date ***
    $account_created = date('Y-m-d H:i:s');
    // *** END CHANGE ***

    // *** START CHANGE: Update the prepared statement ***
    $stmt = $pdo->prepare(
        "INSERT INTO ACCOUNT (Email, Password, Plan, Role, Payment_Method, Plan_Status, SubsStarted, SubsEnd, AccountCreated) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)" // Added AccountCreated
    );
    // *** END CHANGE ***
    
    // *** START CHANGE: Update the execute array ***
    $stmt->execute([
        $email, $passwordHash, $plan, $role, $payment, $plan_status, $subs_started, $subs_end, $account_created // Added $account_created
    ]);
    // *** END CHANGE ***

    $newUserId = $pdo->lastInsertId();

    // Log the action
    $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'CREATE_USER', ?)");
    $log_stmt->execute([$adminId, "Admin added customer: " . $email . " (ID: " . $newUserId . ")"]); 

    echo json_encode(['success' => true, 'message' => 'User added successfully.', 'newUser' => [
        'AccountID' => $newUserId,
        'Email' => $email,
        'Plan' => $plan,
        'Payment_Method' => $payment,
        'Plan_Status' => $plan_status
    ]]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('User add error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error adding user.', 'debug_error' => $e->getMessage()]);
}
