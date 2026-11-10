(function () {
  // Защита: прячем переменные из глобальной видимости консоли
  let currentTestFile = "";
  let currentTestTitle = "";
  let questions = [];
  let currentQuestionIndex = 0;
  let userAnswers = [];

  const menuScreen = document.getElementById("menu-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const resultScreen = document.getElementById("result-screen");
  const questionContainer = document.getElementById("question-container");
  const nextBtn = document.getElementById("next-btn");
  const progressBar = document.getElementById("progress");

  window.renderMenu = function () {
    menuScreen.style.display = "block";
    quizScreen.style.display = "none";
    resultScreen.style.display = "none";

    const todayStr = new Date().toLocaleDateString();
    const buttons = document.querySelectorAll(".menu-btn");

    buttons.forEach((btn) => {
      const testFile = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
      const savedData = localStorage.getItem(`quizResult_${testFile}`);

      if (savedData && JSON.parse(savedData).date === todayStr) {
        btn.classList.add("passed");
      } else {
        btn.classList.remove("passed");
      }
    });
  };

  window.startTest = function (testFile) {
    currentTestFile = testFile;
    const todayStr = new Date().toLocaleDateString();
    const savedData = localStorage.getItem(`quizResult_${testFile}`);

    if (savedData && JSON.parse(savedData).date === todayStr) {
      renderStoredResults(JSON.parse(savedData), true);
      return;
    }

    fetch(`tests/${testFile}`)
      .then((response) => {
        if (!response.ok) throw new Error("Файл теста не найден");
        return response.json();
      })
      .then((data) => {
        questions = data.questions;
        currentTestTitle = data.title;
        document.getElementById("quiz-title").innerText = currentTestTitle;
        currentQuestionIndex = 0;
        userAnswers = [];

        menuScreen.style.display = "none";
        quizScreen.style.display = "block";
        loadQuestion();
      })
      .catch((err) => alert("Ошибка загрузки"));
  };

  function loadQuestion() {
    const q = questions[currentQuestionIndex];
    nextBtn.disabled = true;

    const progressPercent = (currentQuestionIndex / questions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;

    questionContainer.innerHTML = `
            <div class="question-card">
                <span class="category-badge badge-${q.category}">${q.category === "iq" ? "Логика" : "ПДД"}</span>
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

  window.selectOption = function (index) {
    userAnswers[currentQuestionIndex] = index;
    const items = document.querySelectorAll(".option-item");
    items.forEach((item, i) => {
      item.classList.toggle("selected", i === index);
    });
    nextBtn.disabled = false;
  };

  nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      loadQuestion();
    } else {
      saveAndShowResults();
    }
  });

  function saveAndShowResults() {
    let correctCount = 0;
    let errors = [];

    questions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      // Защита: расшифровываем правильный ответ только в момент подсчета результатов
      const realCorrectIndex = parseInt(atob(q.token), 10);

      if (userAnswer === realCorrectIndex) {
        correctCount++;
      } else {
        errors.push({
          question: q.question,
          userAnswerText: q.options[userAnswer] || "Не выбрано",
          correctAnswerText: q.options[realCorrectIndex],
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

    localStorage.setItem(`quizResult_${currentTestFile}`, JSON.stringify(resultData));
    renderStoredResults(resultData, false);
  }

  function renderStoredResults(data, isAlreadyPassedToday) {
    menuScreen.style.display = "none";
    quizScreen.style.display = "none";
    resultScreen.style.display = "block";

    document.getElementById("result-title").innerText = isAlreadyPassedToday ? "Результат сохранен" : "Тест завершен!";
    document.getElementById("already-passed-msg").style.display = isAlreadyPassedToday ? "block" : "none";
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
                    <div class="wrong-details">
                        <p><strong>Ваш ответ:</strong> <span class="text-error">${err.userAnswerText}</span></p>
                        <p><strong>Правильный ответ:</strong> <span class="text-success">${err.correctAnswerText}</span></p>
                        <div class="explanation"><strong>Объяснение:</strong> ${err.explanation}</div>
                    </div>
                `;
        wrongItem.addEventListener("click", function () {
          const d = this.querySelector(".wrong-details");
          d.style.display = window.getComputedStyle(d).display === "block" ? "none" : "block";
        });
        wrongAnswersList.appendChild(wrongItem);
      });
    } else {
      document.getElementById("errors-section").style.display = "none";
    }
  }

  window.goToMenu = function () {
    renderMenu();
  };

  renderMenu();
})(); // Конец инкапсуляции
