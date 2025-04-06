import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

interface Task {
  date: string;
  name: string;
  level: Level;
  assignee: string;
  businessDaysRemaining?: number;
}

type Level = '赤' | '黄' | '青';

interface Holiday {
  date: string;
  name: string;
}

interface SelectedCellData {
  date: string;
  projects: Task[];
  holiday?: Holiday;
}

const holidaysData: Holiday[] = [
  { date: "2025-04-29", name: "昭和の日" },
  { date: "2025-05-03", name: "憲法記念日" },
  { date: "2025-05-04", name: "みどりの日" },
  { date: "2025-05-05", name: "こどもの日" },
  { date: "2025-05-06", name: "振替休日" }
];

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [projectsWithBusinessDays, setProjectsWithBusinessDays] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState(4);
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedCell, setSelectedCell] = useState<SelectedCellData | null>(null);

  // 現在の日付（固定）
  const currentDate = useMemo(() => new Date(), []);

  useEffect(() => {
    try {
      setHolidays(holidaysData);
      setIsLoading(false);
    } catch (error) {
      console.error("データの読み込みに失敗しました:", error);
      setIsLoading(false);
    }
  }, []);

  const changeMonth = (increment: number) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  useEffect(() => {
    if (!isLoading && tasks.length > 0) {
      const calculateBusinessDays = (startDate: string | Date, endDate: string | Date) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start.getTime() === end.getTime()) {
          return 0;
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        let actualStart, actualEnd;
        if (start > end) {
          actualStart = end;
          actualEnd = start;
        } else {
          actualStart = start;
          actualEnd = end;
        }

        let businessDays = 0;
        const current = new Date(actualStart);

        while (current <= actualEnd) {
          const dayOfWeek = current.getDay();
          const dateStr = current.toISOString().split('T')[0];

          if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.some(h => h.date === dateStr)) {
            businessDays++;
          }
          current.setDate(current.getDate() + 1);
        }

        return businessDays;
      };

      const projectsWithDays = tasks.map(project => {
        const projectDate = new Date(project.date);
        const businessDays = calculateBusinessDays(currentDate, projectDate);
        return { ...project, businessDaysRemaining: businessDays };
      });
      setProjectsWithBusinessDays(projectsWithDays);
    }
  }, [tasks, holidays, isLoading, currentDate]);

  const assignees = !isLoading
    ? ["all", ...Array.from(new Set(tasks.map(project => project.assignee)))].sort()
    : ["all"];

  const getFilteredProjects = () => {
    return selectedAssignee === "all"
      ? projectsWithBusinessDays
      : projectsWithBusinessDays.filter(project => project.assignee === selectedAssignee);
  };

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  // セルクリック時のハンドラ
  const handleCellClick = (dateStr: string, dayProjects: Task[], holiday?: Holiday) => {
    setSelectedCell({ date: dateStr, projects: dayProjects, holiday });
  };

  const Calendar = () => {
    const createCalendar = (year: number, month: number) => {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const daysInMonth = lastDay.getDate();
      const firstDayIndex = firstDay.getDay();

      const calendarRows = [];
      let dayCounter = 1;
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

      for (let week = 0; week < 6; week++) {
        const days = [];

        for (let day = 0; day < 7; day++) {
          if ((week === 0 && day < firstDayIndex) || dayCounter > daysInMonth) {
            days.push(
              <td key={`empty-${week}-${day}`} className="calendar-empty"></td>
            );
          } else {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${dayCounter.toString().padStart(2, '0')}`;
            const filteredProjects = getFilteredProjects();
            const dayProjects = filteredProjects.filter(project => project.date === dateStr);
            const isToday = dateStr === currentDate.toISOString().split('T')[0];
            const holiday = holidays.find(h => h.date === dateStr);

            days.push(
              <td
                key={`day-${dayCounter}`}
                className={`calendar-cell large-cell ${isToday ? 'today-cell' : holiday ? 'holiday-cell' : day === 0 ? 'sunday-cell' : day === 6 ? 'saturday-cell' : ''}`}
                onClick={() => handleCellClick(dateStr, dayProjects, holiday)}
              >
                <div className={`day-number ${isToday ? 'today-badge' : holiday ? 'holiday-text' : day === 0 ? 'sunday-text' : day === 6 ? 'saturday-text' : ''}`}>
                  {dayCounter}
                  {isToday && <span className="today-label">Today</span>}
                  {holiday && <div className="holiday-name">{holiday.name}</div>}
                </div>
                <div className="project-list">
                  {dayProjects.map((project, index) => (
                    <div
                      key={index}
                      className={`project-item ${project.level === "青" ? "level-blue" :
                        project.level === "黄" ? "level-yellow" :
                          project.level === "赤" ? "level-red" : "task-not-started"
                        }`}
                    >
                      {project.name}
                      <div className="project-details">
                        <div className="project-header">
                          <span>{project.level}</span>
                          {project.businessDaysRemaining && project.businessDaysRemaining > 0 && (
                            <span className="business-days-tag">
                              残り{project.businessDaysRemaining}営業日
                            </span>
                          )}
                        </div>
                        <div className="assignee-info">
                          <svg className="svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          <span>{project.assignee}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </td>
            );
            dayCounter++;
          }
        }

        calendarRows.push(
          <tr key={`week-${week}`}>
            {days}
          </tr>
        );

        if (dayCounter > daysInMonth) {
          break;
        }
      }

      return (
        <div className="calendar-container">
          <table className="calendar-table">
            <thead>
              <tr>
                {weekdays.map((day, index) => (
                  <th key={day} className={`calendar-header-cell ${index === 0 ? 'sunday-header' : index === 6 ? 'saturday-header' : ''}`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarRows}
            </tbody>
          </table>
        </div>
      );
    };

    return createCalendar(currentYear, currentMonth);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ tasks, holidays }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'project-tasks.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event?.target?.result) {
          const importedData: { tasks: Task[] } = JSON.parse(event.target.result as string);
          if (importedData.tasks && Array.isArray(importedData.tasks)) {
            setTasks(importedData.tasks);
            alert('データを正常にインポートしました。');
          } else {
            alert('無効なデータ形式です。有効なtasksプロパティが含まれている必要があります。');
          }
        }
      } catch (error) {
        console.error('JSONの解析に失敗しました:', error);
        alert('JSONファイルの解析に失敗しました。有効なJSONファイルを選択してください。');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return <div className="loading">データを読み込み中...</div>;
  }

  return (
    <div className="app-container">
      <div className="header">
        <div>
          <h1 className="title">タスク管理</h1>
          <div className="date-text">
            今日の日付: {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="button-group">
          <button onClick={handleExportJSON} className="btn btn-blue">
            JSONエクスポート
          </button>
          <label className="btn btn-purple">
            JSONインポート
            <input type="file" accept=".json" className="file-input" onChange={handleImportJSON} />
          </label>
        </div>
      </div>

      <div className="filter-container">
        <div className="assignee-filter">
          <label htmlFor="assignee-filter" className="filter-label">担当者:</label>
          <select
            id="assignee-filter"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="input-field"
          >
            {assignees.map(assignee => (
              <option key={assignee} value={assignee}>
                {assignee === "all" ? "全員" : assignee}
              </option>
            ))}
          </select>
        </div>
        <div className="month-nav">
          <button onClick={() => changeMonth(-1)} className="btn-nav btn-nav-left">
            前月
          </button>
          <div className="month-display">
            {currentYear}年 {monthNames[currentMonth - 1]}
          </div>
          <button onClick={() => changeMonth(1)} className="btn-nav btn-nav-right">
            次月
          </button>
        </div>
      </div>

      <Calendar />

      <div className="footer-info">

        <div className="assignee-count-section">
          <h3 className="section-title">担当者別タスク数：</h3>
          <div className="assignee-list">
            {assignees.filter(a => a !== "all").map(assignee => {
              const count = tasks.filter(p => p.assignee === assignee).length;
              return (
                <div key={assignee} className="assignee-item">
                  <span className={`assignee-dot ${selectedAssignee === assignee ? 'assignee-selected' : 'assignee-default'}`}></span>
                  <span className={selectedAssignee === assignee ? 'assignee-selected-text' : ''}>
                    {assignee}: {count}件
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* セルクリック時に表示するモーダル */}
      {selectedCell && (
        <div className="modal-overlay" onClick={() => setSelectedCell(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedCell(null)}>×</button>
            <h2>{selectedCell.date}</h2>
            {selectedCell.holiday && <p>祝日: {selectedCell.holiday.name}</p>}
            <h3>タスク一覧</h3>
            {selectedCell.projects.length > 0 ? (
              <ul>
                {selectedCell.projects.map((task, i) => (
                  <li key={i}>
                    {task.name} ({task.level}) - 担当: {task.assignee}
                  </li>
                ))}
              </ul>
            ) : (
              <p>タスクはありません。</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
