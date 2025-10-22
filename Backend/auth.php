<?php
// Backend/auth.php
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
    // Fetch user data including Plan
    $stmt = $pdo->prepare('SELECT AccountID, Email, Password, Plan, Role, Status, SubsEnd FROM ACCOUNT WHERE Email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    $stored = $user['Password'];
    $ok = false;

    // If stored password is hashed with password_hash
    if (password_verify($password, $stored)) {
        $ok = true;
    } else {
        // fallback: plain-text comparison for legacy accounts
        if ($password === $stored) {
            $ok = true;
        }
    }

    if (!$ok) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    // Check if subscription is expired
    $currentDate = date('Y-m-d');
    $subsEnd = $user['SubsEnd'];
    $isExpired = ($subsEnd && $subsEnd < $currentDate);
    
    // If expired, downgrade to Basic
    $plan = $user['Plan'];
    if ($isExpired || $user['Status'] !== 'Active') {
        $plan = 'Basic';
    }

    // Successful login: start session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    // regenerate session id for security
    session_regenerate_id(true);

    // store user info in session including Plan
    $_SESSION['user'] = [
        'AccountID' => $user['AccountID'],
        'Email'     => $user['Email'],
        'Plan'      => $plan,
        'Role'      => $user['Role'],
        'Status'    => $user['Status'],
        'SubsEnd'   => $user['SubsEnd']
    ];

    // Respond with user info (omit password)
    echo json_encode([
        'success' => true,
        'message' => 'Authenticated successfully.',
        'user' => [
            'AccountID' => $user['AccountID'],
            'Email'     => $user['Email'],
            'Plan'      => $plan,
            'Role'      => $user['Role'],
            'Status'    => $user['Status'],
            'SubsEnd'   => $user['SubsEnd'],
            'isExpired' => $isExpired
        ]
    ]);
    exit;
} catch (PDOException $e) {
    error_log('Auth error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error.']);
    exit;
}