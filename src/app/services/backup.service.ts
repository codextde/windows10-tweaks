import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BackupService {
  backupTasks = [];
  history = [];

  constructor() {}

  addTask(task) {
    this.backupTasks.push(task);
    localStorage.setItem('backupTasks', JSON.stringify(this.backupTasks));
  }

  changeTask(task) {
    let foundTask = this.backupTasks.find(obj => obj == task);
    foundTask = task;

    localStorage.setItem('backupTasks', JSON.stringify(this.backupTasks));
  }

  loadTasks() {
    const backupTasks = localStorage.getItem('backupTasks');
    if (backupTasks) {
      this.backupTasks = JSON.parse(backupTasks);
    }
  }

  removeTask(task) {
    this.backupTasks = this.backupTasks.filter(obj => obj !== task);
    localStorage.setItem('backupTasks', JSON.stringify(this.backupTasks));
  }

  addHistory(history) {
    this.history.push(history);
    localStorage.setItem('history', JSON.stringify(this.history));
  }

  changeHistory(history) {
    let foundTask = this.history.find(obj => obj == history);
    foundTask = history;

    localStorage.setItem('history', JSON.stringify(this.history));
  }

  loadHistory() {
    const history = localStorage.getItem('history');
    if (history) {
      this.history = JSON.parse(history);
    }
  }

  removeHistory(history) {
    this.history = this.history.filter(obj => obj !== history);
    localStorage.setItem('history', JSON.stringify(this.history));
  }
}
