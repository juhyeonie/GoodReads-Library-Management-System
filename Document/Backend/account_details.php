<?php
// Backend/account_details.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config.php';

// Check for AccountID passed via GET request
$accountId = $_GET['id'] ?? null;

if (empty($accountId) || !is_numeric($accountId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid Account ID is required.']);
    exit;
}

try {
    // Select all relevant account data
    $stmt = $pdo->prepare(
        "SELECT Email, Role, Plan, Plan_Status, SubsStarted, SubsEnd 
         FROM ACCOUNT WHERE AccountID = ?"
    );
    $stmt->execute([$accountId]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$account) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Account not found.']);
        exit;
    }

    $planName = $account['Plan'];
    $subsStartDisplay = $account['SubsStarted'] ?? 'N/A';
    $subsEndDisplay = $account['SubsEnd'] ?? 'N/A';

    // The frontend will apply the 'Free Plan' label, but we clean nulls here
    $profileData = [
        'AccountID' => $accountId,
        'Email' => $account['Email'],
        'AccountType' => $account['Role'],
        'Plan' => $planName,
        'Status' => $account['Plan_Status'],
        'SubsStarted' => $subsStartDisplay,
        'SubsEnd' => $subsEndDisplay,
    ];

    echo json_encode(['success' => true, 'profile' => $profileData]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Account details fetch error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error fetching profile.']);
}
