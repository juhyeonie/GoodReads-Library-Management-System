<?php
// Backend/auth.php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config.php';  // <-- use your existing config.php

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
    // your config already defines $pdo
    $stmt = $pdo->prepare('SELECT AccountID, Email, Password, Role, Status FROM ACCOUNT WHERE Email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    // Plain text password check (since your DB uses plain text)
    if ($password !== $user['Password']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    if ($user['Status'] !== 'Active') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Account is not active.']);
        exit;
    }

    session_start();
    $_SESSION['AccountID'] = $user['AccountID'];
    $_SESSION['Email'] = $user['Email'];
    $_SESSION['Role'] = $user['Role'];

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'role' => $user['Role'],
        'status'  => $user['Status'],
        'account_id' => $user['AccountID']
    ]);
} catch (Exception $e) {
    error_log('Auth error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
