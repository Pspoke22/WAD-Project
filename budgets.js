let categories = []
let currentMonth = new Date().getMonth() + 1 // Declare currentMonth
let currentYear = new Date().getFullYear() // Declare currentYear

// Function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// Load categories
async function loadCategories() {
  try {
    const response = await fetch("api/categories.php")
    const result = await response.json()

    if (result.success) {
      categories = result.categories.filter((c) => c.type === "expense")
      updateCategorySelect()
    }
  } catch (error) {
    console.error("[v0] Failed to load categories:", error)
  }
}

// Update category select
function updateCategorySelect() {
  const categorySelect = document.getElementById("category")
  categorySelect.innerHTML =
    '<option value="">Select expense category...</option>' +
    categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")
}

// Load budgets
async function loadBudgets() {
  try {
    const response = await fetch(`api/budgets.php?month=${currentMonth}&year=${currentYear}`)
    const result = await response.json()

    if (result.success) {
      displayBudgets(result.budgets)
    }
  } catch (error) {
    console.error("[v0] Failed to load budgets:", error)
  }
}

// Display budgets
function displayBudgets(budgets) {
  const container = document.getElementById("budgetsList")

  if (budgets.length === 0) {
    container.innerHTML = '<p class="text-muted">No budgets set for this month. Click "Set Budget" to create one.</p>'
    return
  }

  container.innerHTML = budgets
    .map((b) => {
      const percentage = (b.spent / b.budget_amount) * 100
      const remaining = b.budget_amount - b.spent
      let progressClass = ""

      if (percentage >= 100) {
        progressClass = "danger"
      } else if (percentage >= 80) {
        progressClass = "warning"
      }

      return `
            <div class="budget-card">
                <div class="budget-header">
                    <div class="budget-category">
                        <span class="category-color" style="background-color: ${b.color}"></span>
                        <h3>${b.category_name}</h3>
                    </div>
                    <button class="btn-delete" onclick="deleteBudget(${b.id})">×</button>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${percentage.toFixed(0)}% used</span>
                        <span>${formatCurrency(b.spent)} / ${formatCurrency(b.budget_amount)}</span>
                    </div>
                </div>
                <div class="budget-amounts">
                    <div class="amount-item">
                        <span class="amount-label">Remaining</span>
                        <span class="amount-value" style="color: ${remaining >= 0 ? "var(--success)" : "var(--danger)"}">
                            ${formatCurrency(Math.abs(remaining))}
                        </span>
                    </div>
                    <div class="amount-item">
                        <span class="amount-label">Budget</span>
                        <span class="amount-value">${formatCurrency(b.budget_amount)}</span>
                    </div>
                </div>
            </div>
        `
    })
    .join("")
}

// Delete budget
async function deleteBudget(id) {
  if (!confirm("Are you sure you want to delete this budget?")) {
    return
  }

  try {
    const response = await fetch("api/budgets.php", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    const result = await response.json()

    if (result.success) {
      loadBudgets()
    } else {
      alert("Failed to delete budget")
    }
  } catch (error) {
    console.error("[v0] Failed to delete budget:", error)
    alert("An error occurred")
  }
}

// Modal handling
const modal = document.getElementById("budgetModal")
const addBtn = document.getElementById("addBudgetBtn")
const closeBtn = document.querySelector(".modal-close")
const cancelBtn = document.getElementById("cancelBtn")
const form = document.getElementById("budgetForm")

addBtn.addEventListener("click", () => {
  modal.classList.add("active")
})

closeBtn.addEventListener("click", () => {
  modal.classList.remove("active")
  form.reset()
})

cancelBtn.addEventListener("click", () => {
  modal.classList.remove("active")
  form.reset()
})

// Add budget
form.addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = new FormData(form)
  const data = {
    category_id: formData.get("category"),
    amount: formData.get("amount"),
    month: currentMonth,
    year: currentYear,
  }

  try {
    const response = await fetch("api/budgets.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (result.success) {
      modal.classList.remove("active")
      form.reset()
      loadBudgets()
    } else {
      alert("Failed to set budget")
    }
  } catch (error) {
    console.error("[v0] Failed to set budget:", error)
    alert("An error occurred")
  }
})

// Setup month navigation
function setupMonthNavigation(loadBudgetsCallback) {
  // Example implementation for month navigation setup
  const prevMonthBtn = document.getElementById("prevMonthBtn")
  const nextMonthBtn = document.getElementById("nextMonthBtn")

  prevMonthBtn.addEventListener("click", () => {
    currentMonth--
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    }
    loadBudgetsCallback()
  })

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    loadBudgetsCallback()
  })
}

// Initial load
loadCategories()
loadBudgets()
