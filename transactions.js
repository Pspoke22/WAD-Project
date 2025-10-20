let categories = []
const currentMonth = new Date().getMonth() + 1 // Declare currentMonth
const currentYear = new Date().getFullYear() // Declare currentYear

// Load categories
async function loadCategories() {
  try {
    const response = await fetch("api/categories.php")
    const result = await response.json()

    if (result.success) {
      categories = result.categories
      updateCategorySelect()
    }
  } catch (error) {
    console.error("[v0] Failed to load categories:", error)
  }
}

// Update category select based on transaction type
function updateCategorySelect() {
  const typeInputs = document.querySelectorAll('input[name="type"]')
  const categorySelect = document.getElementById("category")

  function updateOptions() {
    const selectedType = document.querySelector('input[name="type"]:checked').value
    const filteredCategories = categories.filter((c) => c.type === selectedType)

    categorySelect.innerHTML =
      '<option value="">Select category...</option>' +
      filteredCategories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")
  }

  typeInputs.forEach((input) => {
    input.addEventListener("change", updateOptions)
  })

  updateOptions()
}

// Load transactions
async function loadTransactions() {
  try {
    const response = await fetch(`api/transactions.php?month=${currentMonth}&year=${currentYear}`)
    const result = await response.json()

    if (result.success) {
      displayTransactions(result.transactions)
    }
  } catch (error) {
    console.error("[v0] Failed to load transactions:", error)
  }
}

// Display transactions in table
function displayTransactions(transactions) {
  const container = document.getElementById("transactionsList")

  if (transactions.length === 0) {
    container.innerHTML = '<p class="text-muted">No transactions for this month</p>'
    return
  }

  container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${transactions
                  .map(
                    (t) => `
                    <tr>
                        <td>${formatDate(t.date)}</td>
                        <td>
                            <span class="category-badge" style="background-color: ${t.category_color}">
                                ${t.category_name}
                            </span>
                        </td>
                        <td>${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td>
                        <td class="${t.type}">
                            ${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}
                        </td>
                        <td>${t.note || "-"}</td>
                        <td>
                            <button class="btn-delete" onclick="deleteTransaction(${t.id})">Delete</button>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    `
}

// Delete transaction
async function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) {
    return
  }

  try {
    const response = await fetch("api/transactions.php", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    const result = await response.json()

    if (result.success) {
      loadTransactions()
    } else {
      alert("Failed to delete transaction")
    }
  } catch (error) {
    console.error("[v0] Failed to delete transaction:", error)
    alert("An error occurred")
  }
}

// Modal handling
const modal = document.getElementById("transactionModal")
const addBtn = document.getElementById("addTransactionBtn")
const closeBtn = document.querySelector(".modal-close")
const cancelBtn = document.getElementById("cancelBtn")
const form = document.getElementById("transactionForm")

addBtn.addEventListener("click", () => {
  modal.classList.add("active")
  document.getElementById("date").valueAsDate = new Date()
})

closeBtn.addEventListener("click", () => {
  modal.classList.remove("active")
  form.reset()
})

cancelBtn.addEventListener("click", () => {
  modal.classList.remove("active")
  form.reset()
})

// Add transaction
form.addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = new FormData(form)
  const data = {
    type: formData.get("type"),
    category_id: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note"),
  }

  try {
    const response = await fetch("api/transactions.php", {
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
      loadTransactions()
    } else {
      alert("Failed to add transaction")
    }
  } catch (error) {
    console.error("[v0] Failed to add transaction:", error)
    alert("An error occurred")
  }
})

// Export CSV
document.getElementById("exportBtn").addEventListener("click", () => {
  window.location.href = `api/export-csv.php?month=${currentMonth}&year=${currentYear}`
})

// Setup month navigation
function setupMonthNavigation(callback) {
  // Placeholder for setupMonthNavigation logic
  // This function should be defined elsewhere in your codebase
  // For now, it's just a placeholder to avoid undeclared variable errors
}

// Initial load
loadCategories()
loadTransactions()

// Declare formatDate and formatCurrency functions
function formatDate(date) {
  // Implement your formatDate logic here
  return new Date(date).toLocaleDateString()
}

function formatCurrency(amount) {
  // Implement your formatCurrency logic here
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
}
