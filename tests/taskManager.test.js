const { JSDOM } = require('jsdom');
const fetchMock = require('jest-fetch-mock');

fetchMock.enableMocks();

describe('Task Management Portal', () => {
    let dom;
    let document;
    let window;

    beforeEach(() => {
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>פורטל לניהול משימות משפחות מילואימניקים</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.7/dayjs.min.js"></script>
            <style>
                body {
                    font-family: '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                    color: #333;
                }
                header {
                    background-color: #f5f5f7;
                    color: #000;
                    padding: 1rem;
                    text-align: center;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .container {
                    padding: 2rem;
                    margin: 0 auto;
                    max-width: 800px;
                    background-color: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .screen {
                    display: none;
                }
                .active {
                    display: block;
                }
                .button {
                    padding: 0.75rem 1.5rem;
                    margin: 0.5rem;
                    border: none;
                    border-radius: 12px;
                    background-color: #0071e3;
                    color: white;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                .button:hover {
                    background-color: #005bb5;
                }
                .calendar {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 10px;
                    text-align: center;
                    background-color: #f9f9f9;
                }
                .calendar div {
                    border: 1px solid #e0e0e0;
                    padding: 1rem;
                    border-radius: 8px;
                    background-color: white;
                    transition: all 0.2s;
                    position: relative;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .calendar div .task {
                    font-size: 0.9rem;
                    margin-top: 5px;
                    padding: 3px 8px;
                    border-radius: 8px;
                    color: white;
                }
                .calendar div:hover {
                    background-color: #f1f1f1;
                }
            </style>
        </head>
        <body>
            <div id="appContent">
                <header>
                    <h1 class="text-3xl font-bold">ניהול משימות משפחות מילואימניקים</h1>
                    <div class="flex justify-center mt-4">
                        <button id="taskBtn" class="button" onclick="showScreen('taskScreen')">רשימת משימות</button>
                        <button id="calendarBtn" class="button" onclick="showScreen('calendarScreen')">ניהול לוח שנה</button>
                    </div>
                </header>

                <div id="taskScreen" class="container screen active">
                    <h2 class="text-2xl font-semibold mb-4">הוספת משימה</h2>
                    <form class="task-form space-y-4" onsubmit="addTask(event)">
                        <input type="text" id="taskName" placeholder="שם המשימה" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <input type="text" id="taskExecutor" placeholder="מבצע המשימה" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <input type="date" id="taskDate" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" pattern="\\d{4}-\\d{2}-\\d{2}">
                        <input type="time" id="taskTime" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <input type="color" id="taskColor" value="#0078d7" required class="w-full px-3 py-2">
                        <button type="submit" class="button">הוסף משימה</button>
                    </form>
                    <ul id="taskList" class="mt-4"></ul>
                </div>

                <div id="calendarScreen" class="container screen">
                    <h2 class="text-2xl font-semibold mb-4">לוח שנה</h2>
                    <div class="month-nav flex justify-between items-center mb-4">
                        <button onclick="changeMonth(-1)" class="button">חודש קודם</button>
                        <span id="monthYear" class="text-lg font-semibold"></span>
                        <button onclick="changeMonth(1)" class="button">חודש הבא</button>
                    </div>
                    <div id="calendar" class="calendar grid grid-cols-7 gap-2"></div>
                </div>
            </div>

            <script>
                const tasks = [];
                let currentMonth = new Date().getMonth();
                let currentYear = new Date().getFullYear();
                let editIndex = -1;

                function showScreen(screenId) {
                    const screens = document.querySelectorAll('.screen');
                    screens.forEach(screen => screen.classList.remove('active'));
                    document.getElementById(screenId).classList.add('active');
                    if (screenId === 'calendarScreen') renderCalendar();
                }

                async function fetchTasks() {
                    try {
                        const response = await fetch('http://localhost:3000/tasks');
                        if (!response.ok) {
                            throw new Error('Failed to fetch tasks');
                        }
                        const data = await response.json();
                        console.log('Fetched tasks:', data);
                        tasks.length = 0; // Clear the tasks array
                        tasks.push(...data);
                        renderTaskList();
                        renderCalendar(); // Call renderCalendar after fetching tasks
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }

                async function addTask(event) {
                    event.preventDefault();
                    const name = document.getElementById('taskName').value;
                    const executor = document.getElementById('taskExecutor').value;
                    const date = document.getElementById('taskDate').value;
                    const time = document.getElementById('taskTime').value;
                    const color = document.getElementById('taskColor').value;

                    const task = {
                        name,
                        executor,
                        date,
                        time,
                        color,
                        completed: false
                    };

                    try {
                        let response;
                        if (editIndex === -1) {
                            response = await fetch('http://localhost:3000/tasks', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(task)
                            });
                        } else {
                            response = await fetch(\`http://localhost:3000/tasks/\${tasks[editIndex].id}\`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(task)
                            });
                            editIndex = -1;
                        }

                        if (!response.ok) {
                            throw new Error('Failed to save task');
                        }

                        const result = await response.json();
                        task.id = result.id;
                        tasks.push(task);
                        renderTaskList();
                        document.querySelector('.task-form').reset();
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }

                async function deleteTask(index) {
                    try {
                        const response = await fetch(\`http://localhost:3000/tasks/\${tasks[index].id}\`, { method: 'DELETE' });
                        if (!response.ok) {
                            throw new Error('Failed to delete task');
                        }
                        tasks.splice(index, 1);
                        renderTaskList();
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }

                async function editTask(index) {
                    editIndex = index;
                    const task = tasks[index];
                    document.getElementById('taskName').value = task.name;
                    document.getElementById('taskExecutor').value = task.executor;
                    document.getElementById('taskDate').value = task.date;
                    document.getElementById('taskTime').value = task.time;
                    document.getElementById('taskColor').value = task.color;
                }

                function renderTaskList() {
                    const taskList = document.getElementById('taskList');
                    taskList.innerHTML = '';

                    tasks.forEach((task, index) => {
                        const taskItem = document.createElement('li');
                        taskItem.textContent = \`\${task.name} - \${task.executor} - \${task.date} \${task.time}\`;
                        if (task.completed) taskItem.style.textDecoration = 'line-through';

                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = ' מחק | ';
                        deleteBtn.onclick = () => deleteTask(index);
                        taskItem.appendChild(deleteBtn);

                        const editBtn = document.createElement('button');
                        editBtn.textContent = ' ערוך ';
                        editBtn.onclick = () => editTask(index);
                        taskItem.appendChild(editBtn);

                        taskList.appendChild(taskItem);
                    });
                }

                function renderCalendar() {
                    const calendar = document.getElementById('calendar');
                    calendar.innerHTML = '';

                    const monthYear = document.getElementById('monthYear');
                    monthYear.textContent = \`\${currentMonth + 1}/\${currentYear}\`;

                    const firstDay = new Date(currentYear, currentMonth, 1);
                    const lastDay = new Date(currentYear, currentMonth + 1, 0);

                    for (let day = 1; day <= lastDay.getDate(); day++) {
                        const dayElement = document.createElement('div');
                        dayElement.textContent = day;

                        const currentDate = \`\${currentYear}-\${String(currentMonth + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
                        const tasksForDay = tasks.filter(task => task.date === currentDate);

                        tasksForDay.forEach(task => {
                            const taskElement = document.createElement('div');
                            taskElement.className = 'task';
                            taskElement.textContent = task.name;
                            taskElement.style.backgroundColor = task.color;
                            dayElement.appendChild(taskElement);
                        });

                        calendar.appendChild(dayElement);
                    }
                }

                function changeMonth(offset) {
                    currentMonth += offset;
                    if (currentMonth < 0) {
                        currentMonth = 11;
                        currentYear--;
                    } else if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                    renderCalendar();
                }

                document.addEventListener('DOMContentLoaded', () => {
                    fetchTasks();
                });
            </script>
        </body>
        </html>`;
        dom = new JSDOM(htmlContent, { runScripts: "dangerously" });
        document = dom.window.document;
        window = dom.window;
        window.fetch = fetchMock; // Mock the fetch function
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('Should switch to the task screen when the task button is clicked', () => {
        const taskBtn = document.getElementById('taskBtn');
        taskBtn.click();

        const taskScreen = document.getElementById('taskScreen');
        const calendarScreen = document.getElementById('calendarScreen');

        expect(taskScreen.classList.contains('active')).toBe(true);
        expect(calendarScreen.classList.contains('active')).toBe(false);
    });

    test('Should add a task to the list', async () => {
        fetchMock.mockResponseOnce(JSON.stringify([])); // Mock the initial fetchTasks response

        // Mock the addTask response
        fetchMock.mockResponseOnce(JSON.stringify({
            id: 1,
            name: 'Test Task',
            executor: 'Test Executor',
            date: '2023-10-10',
            time: '10:00',
            color: '#0078d7',
            completed: false
        }));

        // Simulate adding a task
        document.getElementById('taskName').value = 'Test Task';
        document.getElementById('taskExecutor').value = 'Test Executor';
        document.getElementById('taskDate').value = '2023-10-10';
        document.getElementById('taskTime').value = '10:00';
        document.getElementById('taskColor').value = '#0078d7';

        const form = document.querySelector('.task-form');
        form.dispatchEvent(new window.Event('submit'));

        // Wait for the fetch to complete
        await new Promise(resolve => setTimeout(resolve, 0));

        // Check if the task was added to the list
        const taskList = document.getElementById('taskList');
        console.log(taskList.innerHTML); // Debugging line to check the task list content
        expect(taskList.children.length).toBe(1);
        expect(taskList.children[0].textContent).toContain('Test Task');
    });
});