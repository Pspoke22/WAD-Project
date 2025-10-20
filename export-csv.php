<?php
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: ../login.html');
    exit;
}

$user_id = $_SESSION['user_id'];
$month = $_GET['month'] ?? date('m');
$year = $_GET['year'] ?? date('Y');

$conn = getDBConnection();

$stmt = $conn->prepare("
    SELECT t.date, t.type, c.name as category, t.amount, t.note
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND MONTH(t.date) = ? AND YEAR(t.date) = ?
    ORDER BY t.date DESC
");
$stmt->bind_param("iii", $user_id, $month, $year);
$stmt->execute();
$result = $stmt->get_result();

// Set headers for CSV download
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="transactions_' . $year . '_' . $month . '.csv"');

$output = fopen('php://output', 'w');
fputcsv($output, ['Date', 'Type', 'Category', 'Amount', 'Note']);

while ($row = $result->fetch_assoc()) {
    fputcsv($output, $row);
}

fclose($output);
$stmt->close();
$conn->close();
?>
