<?php
// customers.php
// Simple REST API for SQLite (ACCOUNT table).
// Place under your XAMPP htdocs, e.g.
// C:\xampp\htdocs\GoodReads-Library-Management-System\Document\Backend\api\customers.php

// === CONFIG ===
// Path to your sqlite DB file (update if different)
$dbPath = __DIR__ . '/../Database/GoodReads-LibraryManagement.sqlite';

// Allow CORS for local dev (adjust origin if needed)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to open DB: ' . $e->getMessage()]);
    exit;
}

// helper: read JSON body
function getJsonBody() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Very small sanitiser (we use prepared statements to avoid injection)
function sendJson($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

// Route by method and optional id
$method = $_SERVER['REQUEST_METHOD'];
// Accept id at path: /customers.php/123 (PATH_INFO) or via query ?id=123
$id = null;
if (!empty($_SERVER['PATH_INFO'])) {
    // e.g. /123
    $parts = explode('/', trim($_SERVER['PATH_INFO'], '/'));
    if (isset($parts[0]) && $parts[0] !== '') $id = $parts[0];
}
if (!$id && isset($_GET['id'])) $id = $_GET['id'];

// Normalize id to integer when present
if ($id !== null && !ctype_digit((string)$id)) {
    http_response_code(400);
    sendJson(['error' => 'Invalid id']);
}

try {
    if ($method === 'GET') {
        if ($id === null) {
            // Return all accounts
            // Exclude admin roles at DB level:
            $stmt = $pdo->query('SELECT * FROM ACCOUNT ORDER BY AccountID DESC');

            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendJson($rows);
        } else {
            $stmt = $pdo->prepare('SELECT * FROM ACCOUNT WHERE AccountID = ?');
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                sendJson(['error' => 'Not found']);
            }
            sendJson($row);
        }
    } elseif ($method === 'POST') {
        $data = getJsonBody();
        // required field: Email (you can add more validation)
        if (empty($data['email'])) {
            http_response_code(400);
            sendJson(['error' => 'Missing email']);
        }
        // Prepare insert. AccountID is AUTOINCREMENT so we omit it.
        $stmt = $pdo->prepare('INSERT INTO ACCOUNT (Email, Password, Plan, Role, Plan_Status, Payment_Method, SubsStarted, SubsEnd) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['email'],
            $data['password'] ?? '',
            $data['plan'] ?? '',
            $data['role'] ?? 'Customer',
            $data['plan_status'] ?? 'Active',
            $data['payment'] ?? '',
            $data['subsStarted'] ?? null,
            $data['subsEnd'] ?? null
        ]);
        $lastId = $pdo->lastInsertId();
        http_response_code(201);
        sendJson(['success' => true, 'id' => $lastId]);
    } elseif ($method === 'PUT') {
        if ($id === null) { http_response_code(400); sendJson(['error'=>'Missing id']); }
        $data = getJsonBody();
        $fields = [];
        $values = [];
        // Only update fields present in the payload
        $allowed = ['email'=>'Email','password'=>'Password','plan'=>'Plan','role'=>'Role','plan_status'=>'Plan_Status','payment'=>'Payment_Method','subsStarted'=>'SubsStarted','subsEnd'=>'SubsEnd'];
        foreach ($allowed as $k => $col) {
            if (array_key_exists($k, $data)) {
                $fields[] = "$col = ?";
                $values[] = ($data[$k] === null ? null : $data[$k]);
            }
        }
        if (count($fields) === 0) { http_response_code(400); sendJson(['error'=>'Nothing to update']); }
        $values[] = (int)$id;
        $sql = 'UPDATE ACCOUNT SET ' . implode(', ', $fields) . ' WHERE AccountID = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        sendJson(['success' => true, 'changes' => $stmt->rowCount()]);
    } elseif ($method === 'DELETE') {
        if ($id === null) { http_response_code(400); sendJson(['error'=>'Missing id']); }
        $stmt = $pdo->prepare('DELETE FROM ACCOUNT WHERE AccountID = ?');
        $stmt->execute([(int)$id]);
        sendJson(['success' => true, 'changes' => $stmt->rowCount()]);
    } else {
        http_response_code(405);
        sendJson(['error' => 'Method not allowed']);
    }
} catch (Exception $ex) {
    http_response_code(500);
    sendJson(['error' => 'Server error: '.$ex->getMessage()]);
}
