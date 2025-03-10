# **Task Scheduler for Deferred Execution**

This module provides a simple task scheduling system that allows deferring function execution based on priority. Tasks are processed only when `tasksEnabled` is `true`, ensuring that the system can temporarily halt processing during critical operations like user interactions.

## **Installation & Import**

```ts
import { setTasksEnabled, clearTasks, scheduleTask } from './taskScheduler';
```

## **API Reference**

### **`scheduleTask(callback: Task, priority?: 'high' | 'low')`**

Schedules a function to run later, either at **high** or **low** priority.

- **High-priority tasks** are added to the front of the queue and processed first.
- **Low-priority tasks** are added to the back of the queue.

#### **Parameters**

| Parameter  | Type                  | Default      | Description                        |
| ---------- | --------------------- | ------------ | ---------------------------------- | ----------------------------------------------------------- |
| `callback` | `Task` (`() => void`) | **Required** | The function to be executed later. |
| `priority` | `'high'               | 'low'`       | `'low'`                            | Determines whether the task is queued at the front or back. |

#### **Example Usage**

```ts
scheduleTask(() => console.log('Low-priority task'), 'low');
scheduleTask(() => console.log('High-priority task'), 'high');
```

---

### **`setTasksEnabled(enabled: boolean): void`**

Enables or disables task processing.

- When **`false`**, tasks remain in the queue but are not executed.
- When **`true`**, queued tasks begin processing.

#### **Parameters**

| Parameter | Type      | Description                                              |
| --------- | --------- | -------------------------------------------------------- |
| `enabled` | `boolean` | `true` to enable task processing, `false` to disable it. |

#### **Example Usage**

```ts
setTasksEnabled(false); // Pause task execution
setTasksEnabled(true); // Resume task execution
```

This maybe useful to do when navigating to a new page and you can enable tasks again onMount of a new page.

---

### **`clearTasks(): void`**

Clears all pending tasks from the queue.

#### **Example Usage**

```ts
clearTasks(); // Removes all scheduled tasks
```

---

## **Task Processing Behavior**

Tasks are processed when `tasksEnabled` is `true`. The system uses a `setTimeout` with a `Config.taskDelay` or **50ms delay** to process tasks asynchronously.

Additionally, `tasksEnabled` is automatically **disabled during keypresses** and re-enabled when the renderer is idle. This behavior ensures smooth UI updates without interference from background tasks.

### **Automatic Task Disabling on Keypress**

```ts
createRenderEffect(() => {
  activeElement(); // Triggers when focus changes due to user input
  tasksEnabled = false; // Disable task execution while user interacts
});
```

## **Full Example**

```ts
import { scheduleTask, setTasksEnabled, clearTasks } from './taskScheduler';

setTasksEnabled(true); // Enable task processing

scheduleTask(() => console.log('Task 1 - Low priority'), 'low');
scheduleTask(() => console.log('Task 2 - High priority'), 'high');

setTimeout(() => {
  console.log('Disabling tasks temporarily');
  setTasksEnabled(false);

  setTimeout(() => {
    console.log('Re-enabling tasks');
    setTasksEnabled(true);
  }, 500);
}, 1000);
```
