<?php
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$conn = getDBConnection();

// GET - Fetch all transactions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $month = $_GET['month'] ?? date('m');
    $year = $_GET['year'] ?? date('Y');
    
    $stmt = $conn->prepare("
        SELECT t.id, t.amount, t.type, t.date, t.note, 
               c.name as category_name, c.color as category_color, c.id as category_id
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND MONTH(t.date) = ? AND YEAR(t.date) = ?
        ORDER BY t.date DESC, t.created_at DESC
    ");
    $stmt->bind_param("iii", $user_id, $month, $year);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
    
    echo json_encode(['success' => true, 'transactions' => $transactions]);
    $stmt->close();
}

// POST - Add new transaction
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $category_id = $data['category_id'] ?? 0;
    $amount = $data['amount'] ?? 0;
    $type = $data['type'] ?? '';
    $date = $data['date'] ?? date('Y-m-d');
    $note = $data['note'] ?? '';
    
    if ($amount <= 0 || !in_array($type, ['income', 'expense'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO transactions (user_id, category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("iidsss", $user_id, $category_id, $amount, $type, $date, $note);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Transaction added', 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add transaction']);
    }
    $stmt->close();
}

// DELETE - Remove transaction
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $transaction_id = $data['id'] ?? 0;
    
    $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $transaction_id, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Transaction deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete transaction']);
    }
    $stmt->close();
}

$conn->close();
?>
