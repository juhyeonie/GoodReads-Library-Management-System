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
    // prepare and fetch user (case-insensitive email lookup could be added if required)
    $stmt = $pdo->prepare('SELECT AccountID, Email, Password, Role, Status, FullName FROM ACCOUNT WHERE Email = ? LIMIT 1');
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

    // If stored password appears to be a bcrypt (or other password_hash) hash, use password_verify.
    // password_verify will safely return false for non-hash strings.
    if (password_verify($password, $stored)) {
        $ok = true;
    } else {
        // fallback: legacy plain-text or other formats (compare exact)
        // WARNING: plain-text storage is insecure; consider migrating to password_hash.
        if ($password === $stored) {
            $ok = true;
        }
    }

    if (!$ok) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    // Successful login: regenerate session id and store safe user info in session
    session_regenerate_id(true);
    // keep only non-sensitive fields
    $_SESSION['user'] = [
        'AccountID' => $user['AccountID'],
        'Email'     => $user['Email'],
        'Role'      => $user['Role'],
        'Status'    => $user['Status'],
        'FullName'  => isset($user['FullName']) ? $user['FullName'] : null,
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
            'Status' => $user['Status'],
            'FullName' => isset($user['FullName']) ? $user['FullName'] : null
        ]
    ]);
    exit;

} catch (PDOException $ex) {
    // Log server-side in real app. Returning generic message to client.
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error.']);
    exit;
}
