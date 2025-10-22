<?php
// Backend/get_user_plan.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['AccountID'])) {
    echo json_encode([
        'success' => false,
        'loggedIn' => false,
        'message' => 'Not authenticated',
        'plan' => 'Basic' // default for non-logged in users
    ]);
    exit;
}

require_once __DIR__ . '/config.php';

try {
    $accountId = $_SESSION['user']['AccountID'];
    
    // Fetch user's current plan from database
    $stmt = $pdo->prepare('SELECT Plan, Status, SubsEnd FROM ACCOUNT WHERE AccountID = ? LIMIT 1');
    $stmt->execute([$accountId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found',
            'plan' => 'Basic'
        ]);
        exit;
    }
    
    // Check if subscription is still active
    $currentDate = date('Y-m-d');
    $subsEnd = $user['SubsEnd'];
    $isExpired = ($subsEnd && $subsEnd < $currentDate);
    
    // If subscription expired or status is not Active, downgrade to Basic
    $plan = $user['Plan'];
    if ($isExpired || $user['Status'] !== 'Active') {
        $plan = 'Basic';
    }
    
    echo json_encode([
        'success' => true,
        'loggedIn' => true,
        'plan' => $plan,
        'status' => $user['Status'],
        'subsEnd' => $user['SubsEnd'],
        'isExpired' => $isExpired
    ]);
    
} catch (PDOException $e) {
    error_log('Get user plan error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error',
        'plan' => 'Basic'
    ]);
}
exit;