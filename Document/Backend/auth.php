<?php
// Backend/auth.php (FIXED VERSION)
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
    // 1. Fetch User
    $stmt = $pdo->prepare('SELECT AccountID, Email, Password, Role, Plan_Status, Plan, SubsEnd FROM ACCOUNT WHERE Email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    // 2. Verify Password
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

    // --- 3. Subscription Expiration Logic (Only for Users/Customers) ---
    // Check if the role is Customer (or User if you use it)
    if (strtolower($user['Role']) === 'customer' || strtolower($user['Role']) === 'user') {

        // FIX: Ensure SubsEnd is not NULL before using strtotime
        $subsEnd = $user['SubsEnd'];
        
        if (!empty($subsEnd)) {
            $subsEndTimestamp = strtotime($subsEnd);
            $todayTimestamp = strtotime(date('Y-m-d'));
            
            // Check if the plan is paid AND the subscription end date is in the past
            $currentPlanLower = strtolower($currentPlan);
            if (($currentPlanLower === 'standard plan' || $currentPlanLower === 'premium plan') && $subsEndTimestamp < $todayTimestamp) {

                $isSubscriptionExpired = true;
                $currentPlan = 'Basic Plan'; 

                $updateStmt = $pdo->prepare('UPDATE ACCOUNT SET Plan = ?, SubsEnd = NULL, SubsStarted = NULL, Plan_Status = ? WHERE AccountID = ?');
                $updateStmt->execute(['Basic Plan', 'Downgraded', $user['AccountID']]);

                // Update the user array for the session and response
                $user['Plan'] = 'Basic Plan';
                $user['Plan_Status'] = 'Downgraded';
            }
        }
    }
    // --- End Subscription Expiration Logic ---

    // 4. Successful login: Regenerate session and store info
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

    // 5. Return success
    echo json_encode([
        'success' => true,
        'message' => 'Authenticated successfully.',
        'user' => [
            'AccountID' => $user['AccountID'],
            'Email' => $user['Email'],
            'Role' => $user['Role'],
            'Status' => $user['Plan_Status'], 
            'Plan' => $user['Plan'],
            'OriginalPlan' => $originalPlan,
            'IsExpired' => $isSubscriptionExpired,
            'FullName' => null
        ]
    ]);
    exit;

} catch (PDOException $ex) {
    // Log server-side error for debugging
    error_log("Auth PDO error: " . $ex->getMessage());
    http_response_code(500);
    // Return generic JSON message to client
    echo json_encode(['success' => false, 'message' => 'Server error during authentication.']);
    exit;
}