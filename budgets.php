<?php
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$conn = getDBConnection();

// GET - Fetch budgets with spending
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $month = $_GET['month'] ?? date('m');
    $year = $_GET['year'] ?? date('Y');
    
    $stmt = $conn->prepare("
        SELECT b.id, b.amount as budget_amount, b.month, b.year,
               c.id as category_id, c.name as category_name, c.color,
               COALESCE(SUM(t.amount), 0) as spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = c.id 
            AND t.user_id = ? AND MONTH(t.date) = ? AND YEAR(t.date) = ?
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?
        GROUP BY b.id, b.amount, b.month, b.year, c.id, c.name, c.color
    ");
    $stmt->bind_param("iiiiii", $user_id, $month, $year, $user_id, $month, $year);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $budgets = [];
    while ($row = $result->fetch_assoc()) {
        $budgets[] = $row;
    }
    
    echo json_encode(['success' => true, 'budgets' => $budgets]);
    $stmt->close();
}

// POST - Add or update budget
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $category_id = $data['category_id'] ?? 0;
    $amount = $data['amount'] ?? 0;
    $month = $data['month'] ?? date('m');
    $year = $data['year'] ?? date('Y');
    
    if ($amount <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid amount']);
        exit;
    }
    
    $stmt = $conn->prepare("
        INSERT INTO budgets (user_id, category_id, month, year, amount) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE amount = ?
    ");
    $stmt->bind_param("iiiidi", $user_id, $category_id, $month, $year, $amount, $amount);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Budget saved']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save budget']);
    }
    $stmt->close();
}

// DELETE - Remove budget
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $budget_id = $data['id'] ?? 0;
    
    $stmt = $conn->prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $budget_id, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Budget deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete budget']);
    }
    $stmt->close();
}

$conn->close();
?>
