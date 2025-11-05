<?php
// Backend/fetch_receipt.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

$accountId = $_GET['accountId'] ?? null;

if (empty($accountId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Account ID is required.']);
    exit;
}

try {
    // 1. Get User Data from ACCOUNT table
    $userStmt = $pdo->prepare("
        SELECT Email, Plan, SubsStarted, SubsEnd, Payment_Method, Plan_Status 
        FROM ACCOUNT 
        WHERE AccountID = ? AND Role = 'Customer' 
        LIMIT 1
    ");
    $userStmt->execute([$accountId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Customer not found.']);
        exit;
    }

    // Handle Basic Plan specifically
    if ($user['Plan'] === 'Basic Plan') {
        echo json_encode([
            'success' => true,
            'receipt' => [
                'receiptNo' => 'N/A', // No receipt for free plan
                'dateTime' => 'N/A',
                'email' => $user['Email'],
                'planName' => $user['Plan'],
                'planDuration' => 'Ongoing',
                'startDate' => 'N/A', // Or maybe account creation date if available
                'expiryDate' => 'N/A',
                'amountPaid' => '₱0.00',
                'paymentMethod' => $user['Payment_Method'] ?? 'Free Plan',
                'paymentStatus' => 'N/A' // Free plans don't have a payment status in this context
            ]
        ]);
        exit;
    }

    // --- START MODIFICATION ---
    // 2. Determine Amount Paid for (Standard, Premium, etc.)

    $paymentMethod = $user['Payment_Method'] ?? '';
    // Check if the payment method indicates it was free
    $isFreePayment = in_array($paymentMethod, ['Admin Given', 'Free Plan']);

    if ($isFreePayment) {
        // It's a paid plan (e.g., Premium) but was given for free by an admin
        $amountPaidFormatted = '₱0.00';
    } else {
        // It's a normal paid plan. Look up the price from the database.
        $planStmt = $pdo->prepare("SELECT Price FROM SUBSCRIPTION_PLANS WHERE PlanName = ? LIMIT 1");
        $planStmt->execute([$user['Plan']]);
        $planPrice = $planStmt->fetchColumn();
        $amountPaidFormatted = '₱' . number_format((float)$planPrice, 2);
    }
    // --- END MODIFICATION ---


    // 3. Format Dates and Generate Receipt Details
    $receiptNo = 'RCP-' . date('Ymd', strtotime($user['SubsStarted'] ?? time())) . '-' . str_pad($accountId, 3, '0', STR_PAD_LEFT);
    $dateTime = !empty($user['SubsStarted']) ? date('F j, Y - g:i A', strtotime($user['SubsStarted'])) : 'N/A';
    $startDate = !empty($user['SubsStarted']) ? date('F j, Y', strtotime($user['SubsStarted'])) : 'N/A';
    $expiryDate = !empty($user['SubsEnd']) ? date('F j, Y', strtotime($user['SubsEnd'])) : 'N/A';
    $planDuration = '30 Days'; // Assuming all paid plans are 30 days for now

    // Determine Payment Status based on Plan_Status and expiry
    $paymentStatus = 'Paid'; // Default assumption

    if ($isFreePayment) {
        $paymentStatus = 'N/A';
        if ($paymentMethod === 'Admin Given') $paymentStatus = 'N/A (Admin Given)';
    } elseif ($user['Plan_Status'] === 'Expired' || $user['Plan_Status'] === 'Cancelled' || $user['Plan_Status'] === 'Downgraded') {
        $paymentStatus = $user['Plan_Status'];
    } elseif (!empty($user['SubsEnd']) && strtotime($user['SubsEnd']) < time()) {
        $paymentStatus = 'Expired'; // Double-check if expired based on date
    }


    echo json_encode([
        'success' => true,
        'receipt' => [
            'receiptNo' => $receiptNo,
            'dateTime' => $dateTime,
            'email' => $user['Email'],
            'planName' => $user['Plan'],
            'planDuration' => $planDuration,
            'startDate' => $startDate,
            'expiryDate' => $expiryDate,
            'amountPaid' => $amountPaidFormatted, // <-- This now shows ₱0.00 for admin-given subs
            'paymentMethod' => $user['Payment_Method'] ?? 'N/A',
            'paymentStatus' => $paymentStatus
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Receipt fetch error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error loading receipt.', 'debug_error' => $e->getMessage()]);
}
