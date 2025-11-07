// State Management
const state = {
  view: "welcome", // "dashboard", "course", "lesson", "quiz", "certificate"
  showWelcome: true,
  currentCourse: null, // course id
  currentLesson: null, // lesson id
  progress: {}, // track completed lessons and quizzes
  attemptHistory: {}, // track quiz attempts
};

// Load state from localStorage if available
if (localStorage.getItem('dtaState')) {
  const savedState = JSON.parse(localStorage.getItem('dtaState'));
  Object.assign(state, savedState);
}

// Sample Data
const courses = [
  {
    id: 1,
    title: "Introduction to Day Trading",
    description: "Learn the basics of day trading and how to get started.",
    lessons: [
      {
        id: 1,
        title: "What is Day Trading?",
        content:
          "Day trading is buying and selling financial instruments within the same trading day."
      },
      {
        id: 2,
        title: "Risks and Rewards",
        content:
          "Understand the risks and rewards associated with day trading, and how to manage them effectively."
      },
    ],
    quiz: {
      questions: [
        {
          question: "What is day trading?",
          options: [
            "Buying and holding stocks for long-term growth",
            "Buying and selling financial instruments within the same trading day",
            "Investing in mutual funds",
            "Trading based on long-term market analysis",
          ],
          answer: 1,
        },
        {
          question: "What should you understand before day trading?",
          options: [
            "The benefits of long-term holding",
            "Government policies",
            "Risks and rewards associated with day trading",
            "Real estate investment strategies",
          ],
          answer: 2,
        },
      ],
    },
  },
  {
    id: 2,
    title: "Technical Analysis",
    description: "Master the art of analyzing price charts and technical indicators.",
    lessons: [
      {
        id: 1,
        title: "Candlestick Patterns",
        content:
          "Candlestick patterns help traders understand market sentiment and potential price movements."
      },
      {
        id: 2,
        title: "Moving Averages",
        content:
          "Moving averages smooth out price data to identify the direction of a trend."
      },
    ],
    quiz: {
      questions: [
        {
          question: "What do candlestick patterns indicate?",
          options: [
            "Market sentiment and potential price movements",
            "Economic policy changes",
            "Company earnings reports",
            "Long-term market trends",
          ],
          answer: 0,
        },
        {
          question: "What is the purpose of moving averages?",
          options: [
            "To determine company valuations",
            "To smooth out price data and identify trends",
            "To forecast economic cycles",
            "To calculate dividends",
          ],
          answer: 1,
        },
      ],
    },
  },
];

// Helper Functions
function saveState() {
  localStorage.setItem('dtaState', JSON.stringify({
    view: state.view,
    showWelcome: state.showWelcome,
    currentCourse: state.currentCourse,
    currentLesson: state.currentLesson,
    progress: state.progress,
    attemptHistory: state.attemptHistory,
  }));
}

function clearState() {
  localStorage.removeItem('dtaState');
}

function render() {
  saveState(); // Save state on each render
  const courseList = document.getElementById("course-list");
  const lessonList = document.getElementById("lesson-list");
  const quizContainer = document.getElementById("quiz-container");
  const progressChart = document.getElementById("progress-chart");
  const certificateStatus = document.getElementById("certificate-status");

  courseList.innerHTML = "";
  lessonList.innerHTML = "";
  quizContainer.innerHTML = "";
  certificateStatus.textContent = "";

  if (state.view === "welcome") {
    document.getElementById("courses").style.display = "block";
    document.getElementById("lessons").style.display = "none";
    document.getElementById("quiz").style.display = "none";
    document.getElementById("progress").style.display = "block";
    document.getElementById("certificate").style.display = "block";

    if (state.showWelcome) {
      const welcomeSection = document.createElement("section");
      welcomeSection.innerHTML = `
        <h2>Welcome to Day Trading Academy</h2>
        <p>Learn the fundamentals of day trading through interactive courses, quizzes, and more!</p>
        <button id="get-started">Get Started</button>
      `;
      courseList.appendChild(welcomeSection);

      document.getElementById("get-started").addEventListener("click", () => {
        state.showWelcome = false;
        state.view = "dashboard";
        render();
      });
    } else {
      renderDashboard();
    }
  } else if (state.view === "dashboard") {
    renderDashboard();
  } else if (state.view === "course") {
    renderCourse();
  } else if (state.view === "lesson") {
    renderLesson();
  } else if (state.view === "quiz") {
    renderQuiz();
  } else if (state.view === "certificate") {
    renderCertificate();
  }

  renderProgressChart();
}

function renderDashboard() {
  document.getElementById("courses").style.display = "block";
  document.getElementById("lessons").style.display = "none";
  document.getElementById("quiz").style.display = "none";
  document.getElementById("progress").style.display = "block";
  document.getElementById("certificate").style.display = "block";

  courses.forEach((course) => {
    const courseItem = document.createElement("div");
    courseItem.innerHTML = `
      <h3>${course.title}</h3>
      <p>${course.description}</p>
      <button id="start-course-${course.id}">Start Course</button>
    `;
    courseList.appendChild(courseItem);

    document
      .getElementById(`start-course-${course.id}`)
      .addEventListener("click", () => {
        state.currentCourse = course.id;
        state.currentLesson = null;
        state.view = "course";
        render();
      });
  });
}

function renderCourse() {
  document.getElementById("courses").style.display = "none";
  document.getElementById("lessons").style.display = "block";
  document.getElementById("quiz").style.display = "none";
  document.getElementById("progress").style.display = "none";
  document.getElementById("certificate").style.display = "none";

  const course = courses.find((c) => c.id === state.currentCourse);
  course.lessons.forEach((lesson) => {
    const lessonItem = document.createElement("div");
    lessonItem.innerHTML = `
      <h3>${lesson.title}</h3>
      <button id="start-lesson-${lesson.id}">Start Lesson</button>
    `;
    lessonList.appendChild(lessonItem);

    document
      .getElementById(`start-lesson-${lesson.id}`)
      .addEventListener("click", () => {
        state.currentLesson = lesson.id;
        state.view = "lesson";
        render();
      });
  });

  // Add the Quiz button for the course
  const quizButton = document.createElement("button");
  quizButton.textContent = "Take Quiz";
  quizButton.addEventListener("click", () => {
    state.view = "quiz";
    render();
  });
  lessonList.appendChild(quizButton);
}

function renderLesson() {
  document.getElementById("courses").style.display = "none";
  document.getElementById("lessons").style.display = "block";
  document.getElementById("quiz").style.display = "none";
  document.getElementById("progress").style.display = "none";
  document.getElementById("certificate").style.display = "none";

  const course = courses.find((c) => c.id === state.currentCourse);
  const lesson = course.lessons.find((l) => l.id === state.currentLesson);

  lessonList.innerHTML = `
    <h3>${lesson.title}</h3>
    <p>${lesson.content}</p>
    <button id="back-to-course">Back to Course</button>
  `;

  document.getElementById("back-to-course").addEventListener("click", () => {
    state.currentLesson = null;
    state.view = "course";
    render();
  });

  // Mark lesson as completed
  state.progress[`${state.currentCourse}-${lesson.id}`] = true;
  saveState();
}

function renderQuiz() {
  document.getElementById("courses").style.display = "none";
  document.getElementById("lessons").style.display = "none";
  document.getElementById("quiz").style.display = "block";
  document.getElementById("progress").style.display = "none";
  document.getElementById("certificate").style.display = "none";

  const course = courses.find((c) => c.id === state.currentCourse);
  const questions = course.quiz.questions;

  let currentQuestionIndex = 0;
  let score = 0;

  function showQuestion() {
    const question = questions[currentQuestionIndex];
    quizContainer.innerHTML = `
      <h3>${question.question}</h3>
      <ul>
        ${question.options
          .map(
            (option, index) => `
              <li>
                <label>
                  <input type="radio" name="quiz-option" value="${index}" />
                  ${option}
                </label>
              </li>
            `
          )
          .join("")}
      </ul>
      <button id="next-question">${currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"}</button>
    `;

    document.getElementById("next-question").addEventListener("click", () => {
      const selectedOption = document.querySelector(
        'input[name="quiz-option"]:checked'
      );
      if (selectedOption) {
        const answer = parseInt(selectedOption.value);
        if (answer === question.answer) {
          score++;
        }
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          showQuestion();
        } else {
          // Quiz completed
          quizContainer.innerHTML = `
            <h3>Quiz Completed</h3>
            <p>Your score: ${score}/${questions.length}</p>
            <button id="back-to-dashboard">Back to Dashboard</button>
          `;
          document
            .getElementById("back-to-dashboard")
            .addEventListener("click", () => {
              state.view = "dashboard";
              render();
            });

          // Save quiz attempt
          const attemptKey = `${state.currentCourse}`;
          if (!state.attemptHistory[attemptKey]) {
            state.attemptHistory[attemptKey] = [];
          }
          state.attemptHistory[attemptKey].push({ score, date: new Date().toISOString() });
          saveState();
        }
      }
    });
  }

  showQuestion();
}

function renderProgressChart() {
  // Ensure progress chart canvas exists
  if (!document.getElementById("progress-chart")) return;

  const completedLessons = Object.keys(state.progress).length;
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons.length, 0);
  const progressPercentage = (completedLessons / totalLessons) * 100;

  const ctx = document.getElementById("progress-chart").getContext("2d");

  if (window.progressChartInstance) {
    window.progressChartInstance.destroy();
  }

  window.progressChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Remaining"],
      datasets: [
        {
          data: [progressPercentage, 100 - progressPercentage],
          backgroundColor: ["#4caf50", "#f44336"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function renderCertificate() {
  document.getElementById("courses").style.display = "none";
  document.getElementById("lessons").style.display = "none";
  document.getElementById("quiz").style.display = "none";
  document.getElementById("progress").style.display = "none";
  document.getElementById("certificate").style.display = "block";

  const completedLessons = Object.keys(state.progress).length;
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons.length, 0);
  const certificateStatus = document.getElementById("certificate-status");

  if (completedLessons === totalLessons) {
    certificateStatus.innerHTML = `
      Congratulations! You have completed the course. Click the button below to download your certificate.
      <button id="download-certificate">Download Certificate</button>
    `;
    document.getElementById("download-certificate").addEventListener("click", () => {
      alert("Certificate download is not implemented in this demo.");
    });
  } else {
    certificateStatus.textContent = "Complete all lessons and quizzes to earn your certificate.";
  }
}

// Event Listeners for Navigation
const navLinks = document.querySelectorAll("nav a");
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const sectionId = link.getAttribute("href").substring(1);
    state.view = sectionId;
    if (sectionId === "courses") {
      state.view = "dashboard";
    }
    render();
  });
});

// Initial render
render();
