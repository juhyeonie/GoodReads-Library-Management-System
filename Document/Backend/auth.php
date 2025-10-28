<?php
// Backend/auth.php
header('Content-Type: application/json; charset=utf-8');

// allow only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config.php'; // expects $pdo to be defined in config.php

// start session (safe to call even if session already started)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Support JSON request body as well as form-encoded POST
$input = [];
$contentType = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
} else {
    // fallback to $_POST (form submissions / XHR form-encoded)
    $input = $_POST;
}

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

$errors = [];

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Enter a valid email.';
}
if ($password === '') {
    $errors['password'] = 'Password is required.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}

try {
    // FIX 1: Removed FullName, Added Plan_Status to SELECT
    $stmt = $pdo->prepare('SELECT AccountID, Email, Password, Role, Plan_Status, Plan, SubsEnd FROM ACCOUNT WHERE Email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // do not reveal whether email exists
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    $stored = $user['Password'];
    $ok = false;

    // Password Verification (using password_verify for hashes, fallback for plaintext)
    if (password_verify($password, $stored) || $password === $stored) {
        $ok = true;
    }

    if (!$ok) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    $originalPlan = $user['Plan'];
    $currentPlan = $user['Plan'];
    $isSubscriptionExpired = false;

    // --- Subscription Expiration Logic (Only for Users/Customers) ---
    if (strcasecmp($user['Role'], 'Customer') === 0 || strcasecmp($user['Role'], 'User') === 0) { // Renamed from User/Customer

        $subsEndTimestamp = strtotime($user['SubsEnd']);
        $todayTimestamp = strtotime(date('Y-m-d'));

        // Check if the plan is Standard or Premium AND the subscription end date is in the past
        if ($subsEndTimestamp && $subsEndTimestamp < $todayTimestamp) {
             $currentPlanLower = strtolower($currentPlan);
             // UPDATED: Check for the full plan names
             if ($currentPlanLower === 'standard plan' || $currentPlanLower === 'premium plan') {
                $isSubscriptionExpired = true;
                $currentPlan = 'Basic Plan'; // UPDATED: Downgrade to Basic Plan

                // FIX 2: Updated column name from Status to Plan_Status
                $updateStmt = $pdo->prepare('UPDATE ACCOUNT SET Plan = ?, SubsEnd = NULL, SubsStarted = NULL, Plan_Status = ? WHERE AccountID = ?');
                // UPDATED: Use "Basic Plan"
                $updateStmt->execute(['Basic Plan', 'Downgraded', $user['AccountID']]);

                // Update the user array for the session and response
                $user['Plan'] = 'Basic Plan'; // UPDATED
                $user['Plan_Status'] = 'Downgraded';
            }
        }
    }
    // --- End Subscription Expiration Logic ---

    // Successful login: regenerate session id and store safe user info in session
    session_regenerate_id(true);
    // keep only non-sensitive fields
    $_SESSION['user'] = [
        'AccountID' => $user['AccountID'],
        'Email'     => $user['Email'],
        'Role'      => $user['Role'],
        'Status'    => $user['Plan_Status'], 
        'Plan'      => $user['Plan'],
        'FullName'  => null,
        'logged_in_at' => date('c')
    ];

    // return success with non-sensitive data (no password)
    echo json_encode([
        'success' => true,
        'message' => 'Authenticated successfully.',
        'user' => [
            'AccountID' => $user['AccountID'],
            'Email' => $user['Email'],
            'Role' => $user['Role'],
            'Status' => $user['Plan_Status'], 
            'Plan' => $user['Plan'], // New plan status
            'OriginalPlan' => $originalPlan, // Original plan for client-side message
            'IsExpired' => $isSubscriptionExpired, // Flag for client
            'FullName' => null
        ]
    ]);
    exit;

} catch (PDOException $ex) {
    // Log server-side in real app. Returning generic message to client.
    http_response_code(500);
    error_log("Auth error: " . $ex->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
    exit;
}