<?php
// Backend/auth.php - Fixed version with complete session data
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config.php';

$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

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
    // Fetch complete user data including subscription info
    $stmt = $pdo->prepare('SELECT AccountID, Email, Password, Role, Status, Plan, SubsStarted, SubsEnd FROM ACCOUNT WHERE Email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    $stored = $user['Password'];
    $ok = false;

    // Verify password
    if (password_verify($password, $stored)) {
        $ok = true;
    } else {
        // Fallback for plain-text passwords (legacy)
        if ($password === $stored) {
            $ok = true;
        }
    }

    if (!$ok) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    // Check subscription status
    $today = date('Y-m-d');
    $subsEnd = $user['SubsEnd'];
    $status = $user['Status'];

    // Auto-expire if subscription ended
    if ($subsEnd && $subsEnd < $today && $status !== 'Expired') {
        $updateStmt = $pdo->prepare('UPDATE ACCOUNT SET Status = ? WHERE AccountID = ?');
        $updateStmt->execute(['Expired', $user['AccountID']]);
        $status = 'Expired';
    }

    // Start session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    session_regenerate_id(true);

    // Store complete user info in session
    $_SESSION['user'] = [
        'AccountID' => $user['AccountID'],
        'Email'     => $user['Email'],
        'Role'      => $user['Role'],
        'Status'    => $status,
        'Plan'      => $user['Plan'],
        'SubsStarted' => $user['SubsStarted'],
        'SubsEnd'   => $user['SubsEnd']
    ];

    // Return user data (excluding password)
    echo json_encode([
        'success' => true,
        'message' => 'Authenticated successfully.',
        'user' => [
            'AccountID' => $user['AccountID'],
            'Email'     => $user['Email'],
            'Role'      => $user['Role'],
            'Status'    => $status,
            'Plan'      => $user['Plan'],
            'SubsStarted' => $user['SubsStarted'],
            'SubsEnd'   => $user['SubsEnd']
        ]
    ]);
    exit;
} catch (PDOException $e) {
    error_log('Auth error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error.']);
    exit;
}