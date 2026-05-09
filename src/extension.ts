import * as vscode from 'vscode';
import { Storage } from './storage';
import { Tracker } from './tracker';
import { formatDuration, renderTodayHtml, renderAllTimeHtml } from './stats';
import { Sync } from './sync';

let storage: Storage;
let statusBar: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext): void {
  storage = new Storage(context.globalStorageUri.fsPath);

  // what's the matter people??

  const sync = new Sync(context);
  context.subscriptions.push(sync.start());

  const tracker = new Tracker(storage, sync);
  tracker.start(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('codava.flushNow', () => sync.flush()),
  );

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = 'codava.showStats';
  statusBar.tooltip = 'Codava — click for today\'s stats';
  context.subscriptions.push(statusBar);
  refreshStatusBar();
  statusBar.show();

  const refreshTimer = setInterval(refreshStatusBar, 30 * 1000);
  context.subscriptions.push({ dispose: () => clearInterval(refreshTimer) });

  context.subscriptions.push(
    vscode.commands.registerCommand('codava.showStats', () => {
      const panel = vscode.window.createWebviewPanel('codavaToday', 'Codava — Today', vscode.ViewColumn.One, {});
      panel.webview.html = renderTodayHtml(storage.getToday());
    }),
    vscode.commands.registerCommand('codava.showAllTime', () => {
      const panel = vscode.window.createWebviewPanel('codavaAll', 'Codava — All Time', vscode.ViewColumn.One, {});
      panel.webview.html = renderAllTimeHtml(storage.getAll());
    }),
  );
}

function refreshStatusBar(): void {
  const today = storage.getToday();
  const total = today?.totalSeconds ?? 0;
  statusBar.text = `$(watch) ${formatDuration(total)}`;
}

export function deactivate(): void {
  storage?.save();
}
