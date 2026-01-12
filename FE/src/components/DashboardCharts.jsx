import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

export function SkillAccuracyChart({ weakSkills }) {
  const data = useMemo(() => {
    const rows = Array.isArray(weakSkills) ? weakSkills : [];
    const labels = rows.map((x) => x.skill || "Unknown");
    const values = rows.map((x) => Math.round(Number(x.accuracy || 0) * 100));

    return {
      labels,
      datasets: [
        {
          label: "Độ chính xác (%)",
          data: values,
        },
      ],
    };
  }, [weakSkills]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { min: 0, max: 100 },
      },
    }),
    []
  );

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
}

export function ProgressOverTimeChart({ recent3 }) {
  const data = useMemo(() => {
    const rows = Array.isArray(recent3) ? recent3.slice().reverse() : [];
    const labels = rows.map((x) => x.date || x.testName || "—");
    const values = rows.map((x) => Number(x.accuracyPercent || 0));

    return {
      labels,
      datasets: [
        {
          label: "Độ chính xác (%)",
          data: values,
          tension: 0.35,
        },
      ],
    };
  }, [recent3]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { min: 0, max: 100 },
      },
    }),
    []
  );

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}
