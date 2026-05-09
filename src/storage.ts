import * as fs from 'fs';
import * as path from 'path';

export interface DayStats {
  date: string;
  totalSeconds: number;
  byLanguage: Record<string, number>;
  byProject: Record<string, number>;
  byFile: Record<string, number>;
}

export class Storage {
  private filePath: string;
  private data: Record<string, DayStats> = {};

  constructor(storageDir: string) {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.filePath = path.join(storageDir, 'codava.json');
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      } catch {
        this.data = {};
      }
    }
  }

  save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  addSeconds(seconds: number, language: string, project: string, file: string): void {
    const date = new Date().toISOString().slice(0, 10);
    if (!this.data[date]) {
      this.data[date] = {
        date,
        totalSeconds: 0,
        byLanguage: {},
        byProject: {},
        byFile: {},
      };
    }
    const day = this.data[date];
    day.totalSeconds += seconds;
    day.byLanguage[language] = (day.byLanguage[language] ?? 0) + seconds;
    day.byProject[project] = (day.byProject[project] ?? 0) + seconds;
    day.byFile[file] = (day.byFile[file] ?? 0) + seconds;
  }

  getToday(): DayStats | undefined {
    const date = new Date().toISOString().slice(0, 10);
    return this.data[date];
  }

  getAll(): Record<string, DayStats> {
    return this.data;
  }
}
