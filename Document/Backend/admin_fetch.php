<?php
// Backend/admin_fetch.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

$searchTerm = $_GET['search'] ?? '';
$filterRole = $_GET['filter'] ?? 'all'; 

// --- QUERY UPDATED ---
// Only fetch non-customer AND non-SuperAdmin roles
$sql = "SELECT AccountID, Email, Role FROM ACCOUNT WHERE Role != 'Customer' AND Role != 'SuperAdmin'";
$params = [];

// Apply Search
if (!empty($searchTerm)) {
    $sql .= " AND (AccountID = ? OR Email LIKE ?)";
    $params[] = $searchTerm; 
    $params[] = '%' . $searchTerm . '%';
}

// Apply Filter
if ($filterRole !== 'all') {
    // Filter is already safe since SuperAdmin is excluded from the base query
    $sql .= " AND Role = ?";
    $params[] = $filterRole; 
}

$sql .= " ORDER BY Role, AccountID DESC";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'users' => $admins]); // 'users' key for consistency

} catch (PDOException $e) {
    http_response_code(500);
    error_log('Admin fetch error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error loading admins.']);
}