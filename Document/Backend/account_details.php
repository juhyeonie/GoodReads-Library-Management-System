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
    // MODIFIED: Select all required account data including Payment_Method. 
    // We'll use SubsStarted as the "CreationDate" proxy, as a dedicated field isn't in the schema.
    $stmt = $pdo->prepare(
        "SELECT Email, Role, Plan, Plan_Status, SubsStarted, SubsEnd, Payment_Method 
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
    $paymentMethod = $account['Payment_Method'] ?? 'N/A';

    $profileData = [
        'AccountID' => $accountId,
        'Email' => $account['Email'],
        'Role' => $account['Role'], // Changed AccountType to Role based on schema
        'Plan' => $planName,
        'Status' => $account['Plan_Status'],
        'Payment_Method' => $paymentMethod, // ADDED: Payment_Method
        'SubsStarted' => $subsStartDisplay,
        'SubsEnd' => $subsEndDisplay,
        // The front-end expects 'CreationDate' to process data, even if we remove it later.
        'CreationDate' => $account['SubsStarted'] // Using SubsStarted as a placeholder for creation date
    ];

    echo json_encode(['success' => true, 'profile' => $profileData]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Account details fetch error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error fetching profile.']);
}
