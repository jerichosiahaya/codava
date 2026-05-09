import * as vscode from 'vscode';
import * as path from 'path';
import { Storage } from './storage';
import { Sync } from './sync';

const IDLE_TIMEOUT_MS = 2 * 60 * 1000;
const TICK_MS = 30 * 1000;

export class Tracker {
  private lastActivity: number = 0;
  private lastTick: number = 0;
  private currentLanguage: string = 'unknown';
  private currentProject: string = 'unknown';
  private currentFile: string = 'unknown';
  private windowFocused: boolean = true;
  private timer: NodeJS.Timeout | undefined;

  constructor(private storage: Storage, private sync?: Sync) {}

  start(context: vscode.ExtensionContext): void {
    this.updateContextFromEditor(vscode.window.activeTextEditor);
    this.markActivity();

    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(() => this.markActivity()),
      vscode.window.onDidChangeActiveTextEditor((e) => {
        this.updateContextFromEditor(e);
        this.markActivity();
      }),
      vscode.workspace.onDidSaveTextDocument(() => this.markActivity()),
      vscode.window.onDidChangeWindowState((s) => {
        this.windowFocused = s.focused;
        if (s.focused) this.markActivity();
      }),
    );

    this.timer = setInterval(() => this.tick(), TICK_MS);
    context.subscriptions.push({ dispose: () => this.timer && clearInterval(this.timer) });
  }

  private updateContextFromEditor(editor: vscode.TextEditor | undefined): void {
    if (!editor) return;
    const doc = editor.document;
    this.currentLanguage = doc.languageId || 'unknown';
    this.currentFile = path.basename(doc.fileName);
    const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
    this.currentProject = folder ? folder.name : 'unknown';
  }

  private markActivity(): void {
    const now = Date.now();
    if (this.lastTick === 0) this.lastTick = now;
    this.lastActivity = now;
  }

  private tick(): void {
    const now = Date.now();
    if (!this.windowFocused) {
      this.lastTick = now;
      return;
    }
    if (now - this.lastActivity > IDLE_TIMEOUT_MS) {
      this.lastTick = now;
      return;
    }
    const elapsed = Math.floor((now - this.lastTick) / 1000);
    if (elapsed > 0) {
      this.storage.addSeconds(elapsed, this.currentLanguage, this.currentProject, this.currentFile);
      this.storage.save();
      this.sync?.enqueue({
        ts: new Date(now).toISOString(),
        language: this.currentLanguage,
        project: this.currentProject,
        file: this.currentFile,
      });
    }
    this.lastTick = now;
  }
}
