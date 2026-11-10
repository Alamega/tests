// База данных вопросов
const questions = [
  {
    id: 1,
    category: "iq",
    categoryName: "Тест на IQ",
    question: "Продолжите числовой ряд: 2, 4, 8, 16, ...",
    options: ["20", "24", "32", "64"],
    correct: 2,
    explanation: "Каждое следующее число умножается на 2.",
  },
  {
    id: 2,
    category: "pdd",
    categoryName: "ПДД",
    question: "Что означает мигающий зеленый сигнал светофора?",
    options: ["Запрещает движение", "Разрешает движение и информирует, что время его действия истекает", "Обязывает уступить дорогу встречному транспорту"],
    correct: 1,
    explanation: "Мигающий зеленый разрешает движение и сообщает, что вскоре включится запрещающий сигнал.",
  },
  {
    id: 3,
    category: "iq",
    categoryName: "Тест на IQ",
    question: "Какое слово лишнее: Книга, Тетрадь, Блокнот, Компас?",
    options: ["Книга", "Тетрадь", "Блокнот", "Компас"],
    correct: 3,
    explanation: "Компас — это навигационный прибор, а всё остальное — бумажная канцелярия.",
  },
];

let currentQuestionIndex = 0;
let userAnswers = [];

const questionContainer = document.getElementById("question-container");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

// Проверка: проходил ли юзер тест сегодня
function checkDailyStatus() {
  const todayStr = new Date().toLocaleDateString(); // Формат "ДД.ММ.ГГГГ"
  const savedData = localStorage.getItem("dailyQuizResult");

  if (savedData) {
    const parsed = JSON.parse(savedData);
    // Если даты совпадают, сразу выкидываем на результат
    if (parsed.date === todayStr) {
      renderStoredResults(parsed);
      return true;
    }
  }
  return false;
}

// Загрузка вопроса
function loadQuestion() {
  const q = questions[currentQuestionIndex];
  nextBtn.disabled = true;

  const progressPercent = (currentQuestionIndex / questions.length) * 100;
  progressBar.style.width = `${progressPercent}%`;

  questionContainer.innerHTML = `
        <div class="question-card active">
            <span class="category-badge badge-${q.category}">${q.categoryName}</span>
            <div class="question-text">${q.question}</div>
            <ul class="options-list">
                ${q.options
                  .map(
                    (option, index) => `
                    <li class="option-item" onclick="selectOption(${index})">${option}</li>
                `,
                  )
                  .join("")}
            </ul>
        </div>
    `;
}

// Выбор ответа
window.selectOption = function (index) {
  userAnswers[currentQuestionIndex] = index;

  const items = document.querySelectorAll(".option-item");
  items.forEach((item, i) => {
    if (i === index) item.classList.add("selected");
    else item.classList.remove("selected");
  });

  nextBtn.disabled = false;
};

// Клик "Далее"
nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    loadQuestion();
  } else {
    saveAndShowResults();
  }
});

// Сохранение текущего результата и показ экрана
function saveAndShowResults() {
  let correctCount = 0;
  let errors = [];

  questions.forEach((q, index) => {
    const userAnswer = userAnswers[index];
    if (userAnswer === q.correct) {
      correctCount++;
    } else {
      errors.push({
        question: q.question,
        userAnswerText: q.options[userAnswer] || "Не выбрано",
        correctAnswerText: q.options[q.correct],
        explanation: q.explanation,
      });
    }
  });

  const resultData = {
    date: new Date().toLocaleDateString(),
    correct: correctCount,
    incorrect: questions.length - correctCount,
    errors: errors,
  };

  // Записываем данные в память браузера
  localStorage.setItem("dailyQuizResult", JSON.stringify(resultData));

  renderStoredResults(resultData);
}

// Отрисовка экрана результатов на основе сохраненных данных
function renderStoredResults(data) {
  quizScreen.style.display = "none";
  resultScreen.style.display = "block";

  // Если функция вызвана при повторном заходе — меняем заголовок и плашку
  if (data.date === new Date().toLocaleDateString() && currentQuestionIndex === 0) {
    document.getElementById("result-title").innerText = "Результат сохранен";
    document.getElementById("already-passed-msg").style.display = "block";
  }

  document.getElementById("correct-count").innerText = data.correct;
  document.getElementById("incorrect-count").innerText = data.incorrect;

  const wrongAnswersList = document.getElementById("wrong-answers-list");
  wrongAnswersList.innerHTML = "";

  if (data.errors.length > 0) {
    document.getElementById("errors-section").style.display = "block";

    data.errors.forEach((err) => {
      const wrongItem = document.createElement("div");
      wrongItem.className = "wrong-item";
      wrongItem.innerHTML = `
                <div class="wrong-question-title">❌ Ошибка в вопросе: "${err.question}"</div>
                <div style="font-size:13px; color:#718096; margin-bottom:5px;">(Кликните, чтобы посмотреть разбор)</div>
                <div class="wrong-details">
                    <p><strong>Ваш ответ:</strong> <span class="text-error">${err.userAnswerText}</span></p>
                    <p><strong>Правильный ответ:</strong> <span class="text-success">${err.correctAnswerText}</span></p>
                    <div class="explanation"><strong>Объяснение:</strong> ${err.explanation}</div>
                </div>
            `;

      wrongItem.addEventListener("click", function () {
        const details = this.querySelector(".wrong-details");
        const isVisible = window.getComputedStyle(details).display === "block";
        details.style.display = isVisible ? "none" : "block";
      });

      wrongAnswersList.appendChild(wrongItem);
    });
  } else {
    document.getElementById("errors-section").style.display = "none";
  }
}

// Точка входа: сначала проверяем статус, если не проходил — запускаем тест
if (!checkDailyStatus()) {
  loadQuestion();
}
