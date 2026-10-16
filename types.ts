
export enum TaskType {
  TASK1 = 'TASK1', // 四位數顯示裝置
  TASK2 = 'TASK2'  // 鍵盤輸入顯示裝置
}

export interface ReviewResult {
  hasError: boolean;
  score: number; // 0-100
  blankResults: {
    index: number;
    userValue: string;
    correctValue: string;
    isCorrect: boolean;
  }[];
  errors: string[];
  suggestions: string[];
}

export interface ExamParams {
  day: string; // 僅日期 (DD)
  stationId: string; // 崗位編號 (01-99)
}
