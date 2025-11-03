<?php
// save_annotation.php
// Expects JSON POST: {pdf_path, page, text, note}
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { http_response_code(400); exit('Bad request'); }
$db = new PDO('sqlite:db/reader.sqlite');
$stmt = $db->prepare('INSERT INTO annotations (pdf_path,page,text,note,created_at) VALUES (?,?,?,?,?)');
$stmt->execute([$data['pdf_path'],$data['page'],$data['text'],$data['note'], time()]);
echo json_encode(['ok'=>true,'id'=>$db->lastInsertId()]);
