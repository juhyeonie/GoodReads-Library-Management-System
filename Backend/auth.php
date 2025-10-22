<?php
// Backend/auth.php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config.php';  // config.php must create a $pdo PDO instance

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
    // prepare and execute
    $stmt = $pdo->prepare('SELECT AccountID, Email, Password, Role, Status FROM ACCOUNT WHERE Email = ? LIMIT 1');
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

    // Successful login: start session and return success (do NOT return password)
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    // regenerate session id for security
    session_regenerate_id(true);

    // store minimal user info in session
    $_SESSION['user'] = [
        'AccountID' => $user['AccountID'],
        'Email'     => $user['Email'],
        'Role'      => $user['Role'],
        'Status'    => $user['Status']
    ];

    // Respond with user info (omit sensitive fields)
    echo json_encode([
        'success' => true,
        'message' => 'Authenticated successfully.',
        'user' => [
            'AccountID' => $user['AccountID'],
            'Email'     => $user['Email'],
            'Role'      => $user['Role'],
            'Status'    => $user['Status']
        ]
    ]);
    exit;
} catch (PDOException $e) {
    // Don't leak DB errors to clients in production. Log it server-side instead.
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error.']);
    exit;
}
