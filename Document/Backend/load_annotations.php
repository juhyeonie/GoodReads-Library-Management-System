<?php
// load_annotations.php?pdf=Media/Books/DUNE1.pdf
$pdf = $_GET['pdf'] ?? '';
$db = new PDO('sqlite:db/reader.sqlite');
$stmt = $db->prepare('SELECT * FROM annotations WHERE pdf_path = ?');
$stmt->execute([$pdf]);
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
header('Content-Type: application/json');
echo json_encode($res);
