import { Chart } from "@/components/ui/chart"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { setupMonthNavigation } from "@/utils/navigation"

let expenseChart = null
const currentMonth = new Date().getMonth() + 1 // January is 0, so add 1
const currentYear = new Date().getFullYear()

// Load dashboard data
async function loadDashboard() {
  try {
    const response = await fetch(`api/dashboard.php?month=${currentMonth}&year=${currentYear}`)
    const result = await response.json()

    if (result.success) {
      const data = result.data

      // Update stats
      document.getElementById("totalIncome").textContent = formatCurrency(data.income)
      document.getElementById("totalExpenses").textContent = formatCurrency(data.expenses)
      document.getElementById("balance").textContent = formatCurrency(data.balance)

      // Update chart
      updateExpenseChart(data.expense_by_category)

      // Update recent transactions
      displayRecentTransactions(data.recent_transactions)
    }
  } catch (error) {
    console.error("[v0] Failed to load dashboard:", error)
  }
}

// Update expense chart
function updateExpenseChart(categoryData) {
  const ctx = document.getElementById("expenseChart").getContext("2d")

  if (expenseChart) {
    expenseChart.destroy()
  }

  if (categoryData.length === 0) {
    ctx.font = "16px sans-serif"
    ctx.fillStyle = "#64748b"
    ctx.textAlign = "center"
    ctx.fillText("No expenses yet", ctx.canvas.width / 2, ctx.canvas.height / 2)
    return
  }

  expenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categoryData.map((c) => c.name),
      datasets: [
        {
          data: categoryData.map((c) => c.total),
          backgroundColor: categoryData.map((c) => c.color),
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => context.label + ": " + formatCurrency(context.parsed),
          },
        },
      },
    },
  })
}

// Display recent transactions
function displayRecentTransactions(transactions) {
  const container = document.getElementById("recentTransactions")

  if (transactions.length === 0) {
    container.innerHTML = '<p class="text-muted">No transactions yet</p>'
    return
  }

  container.innerHTML = transactions
    .map(
      (t) => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-category" style="background-color: ${t.category_color}">
                    ${t.category_name.charAt(0)}
                </div>
                <div class="transaction-details">
                    <h4>${t.category_name}</h4>
                    <p>${formatDate(t.date)}</p>
                </div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}
            </div>
        </div>
    `,
    )
    .join("")
}

// Setup month navigation
setupMonthNavigation(loadDashboard)

// Initial load
loadDashboard()
