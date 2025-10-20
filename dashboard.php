<?php
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$month = $_GET['month'] ?? date('m');
$year = $_GET['year'] ?? date('Y');

$conn = getDBConnection();

// Get total income
$stmt = $conn->prepare("
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM transactions 
    WHERE user_id = ? AND type = 'income' AND MONTH(date) = ? AND YEAR(date) = ?
");
$stmt->bind_param("iii", $user_id, $month, $year);
$stmt->execute();
$income = $stmt->get_result()->fetch_assoc()['total'];
$stmt->close();

// Get total expenses
$stmt = $conn->prepare("
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM transactions 
    WHERE user_id = ? AND type = 'expense' AND MONTH(date) = ? AND YEAR(date) = ?
");
$stmt->bind_param("iii", $user_id, $month, $year);
$stmt->execute();
$expenses = $stmt->get_result()->fetch_assoc()['total'];
$stmt->close();

// Get expenses by category
$stmt = $conn->prepare("
    SELECT c.name, c.color, COALESCE(SUM(t.amount), 0) as total
    FROM categories c
    LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = ? AND MONTH(t.date) = ? AND YEAR(t.date) = ?
    WHERE c.user_id = ? AND c.type = 'expense'
    GROUP BY c.id, c.name, c.color
    HAVING total > 0
    ORDER BY total DESC
");
$stmt->bind_param("iiii", $user_id, $month, $year, $user_id);
$stmt->execute();
$result = $stmt->get_result();

$expense_by_category = [];
while ($row = $result->fetch_assoc()) {
    $expense_by_category[] = $row;
}
$stmt->close();

// Get recent transactions
$stmt = $conn->prepare("
    SELECT t.id, t.amount, t.type, t.date, t.note, c.name as category_name, c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND MONTH(t.date) = ? AND YEAR(t.date) = ?
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT 5
");
$stmt->bind_param("iii", $user_id, $month, $year);
$stmt->execute();
$result = $stmt->get_result();

$recent_transactions = [];
while ($row = $result->fetch_assoc()) {
    $recent_transactions[] = $row;
}
$stmt->close();

$conn->close();

echo json_encode([
    'success' => true,
    'data' => [
        'income' => floatval($income),
        'expenses' => floatval($expenses),
        'balance' => floatval($income - $expenses),
        'expense_by_category' => $expense_by_category,
        'recent_transactions' => $recent_transactions
    ]
]);
?>
