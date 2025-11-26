document.addEventListener("DOMContentLoaded", () => {
  const balanceEl = document.getElementById("balance");
  const incomeAmountEl = document.getElementById("income-amount");
  const expenseAmountEl = document.getElementById("expense-amount");
  const transactionListEl = document.getElementById("transaction-list");
  const transactionFormEl = document.getElementById("transaction-form");
  const descriptionEl = document.getElementById("description");
  const amountEl = document.getElementById("amount");
  const categoryEl = document.getElementById("category");
  const categoryGroup = document.getElementById("category-group");
  const themeToggleBtn = document.getElementById("theme-toggle");
  const balanceContainer = document.getElementById("balance-container");

  let balanceChart = null;
  let categoryChart = null;
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggleBtn.innerHTML =
    savedTheme === "dark"
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';

  themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const newTheme = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeToggleBtn.innerHTML =
      newTheme === "dark"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
  });

  amountEl.addEventListener("input", () => {
    const amount = parseFloat(amountEl.value);
    categoryGroup.style.display = !isNaN(amount) && amount < 0 ? "block" : "none";
  });

  transactionFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);
    if (!description || isNaN(amount)) return;

    const isExpense = amount < 0;
    const category = isExpense ? categoryEl.value || "Other" : "Income";

    transactions.push({
      id: Date.now(),
      description,
      amount,
      category,
    });

    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateUI();
    transactionFormEl.reset();
    categoryGroup.style.display = "none";
  });

  transactionListEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = parseInt(e.target.dataset.id, 10);
      transactions = transactions.filter((t) => t.id !== id);
      localStorage.setItem("transactions", JSON.stringify(transactions));
      updateUI();
    }
  });

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);
  }

  function getExpenseCategories() {
    const expenses = transactions.filter((t) => t.amount < 0);
    const categories = {};
    expenses.forEach((t) => {
      const cat = t.category || "Other";
      categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
    });
    return categories;
  }

  function updateUI() {
    updateTransactionList();
    updateSummary();
    updateCharts();
  }

  function updateTransactionList() {
    transactionListEl.innerHTML = "";
    const sorted = [...transactions].reverse();
    sorted.forEach((t) => {
      const li = document.createElement("li");
      li.className = `transaction ${t.amount >= 0 ? "income" : "expense"}`;
      li.innerHTML = `
        <div>
          <strong>${t.description}</strong>
          <small>${t.category}${t.amount >= 0 ? "" : " (Expense)"}</small>
        </div>
        <div>
          ${formatCurrency(t.amount)}
          <button class="delete-btn" data-id="${t.id}">×</button>
        </div>
      `;
      transactionListEl.appendChild(li);
    });
  }

  function updateSummary() {
    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);

    balanceEl.textContent = formatCurrency(balance);
    incomeAmountEl.textContent = formatCurrency(income);
    expenseAmountEl.textContent = formatCurrency(expenses);

    balanceContainer.classList.toggle("negative", balance < 0);
    balanceContainer.classList.toggle("positive", balance >= 0);
  }

  function updateCharts() {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = Math.abs(
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const balanceCtx = document.getElementById("balanceChart").getContext("2d");
    if (balanceChart) balanceChart.destroy();

    balanceChart = new Chart(balanceCtx, {
      type: "bar",
      data: {  
        labels: ["Income", "Expenses"],
        datasets: [
          {
            data: [income, expenses],
            backgroundColor: ["#10b981", "#ef4444"],
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Income vs Expenses", color: "#64748b" },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return `₹${value.toLocaleString()}`;
              },
            },
          },
        },
      },
    });

    const catData = getExpenseCategories();
    const labels = Object.keys(catData);
    const data = Object.values(catData);

    const categoryCtx = document.getElementById("categoryChart").getContext("2d");
    if (categoryChart) categoryChart.destroy();

    if (labels.length > 0) {
      categoryChart = new Chart(categoryCtx, {
        type: "pie",
        data: { 
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: [
                "crimson",
                "orangered",
                "yellow",
                "lightgreen",
                "skyblue",
                "hotpink",
                "chocolate",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "right" },
            title: { display: true, text: "Expenses by Category", color: "#64748b" },
          },
        },
      });
    }
  }

  updateUI();
});