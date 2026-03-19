import { Server as SocketIOServer, Socket } from 'socket.io';
import { WorkflowEvent } from '../types';

export class EventBus {
    private io: SocketIOServer | null = null;
    private listeners: Map<string, Set<(event: WorkflowEvent) => void>> = new Map();

    initialize(io: SocketIOServer): void {
        this.io = io;
    }

    emit(event: WorkflowEvent): void {
        if (this.io) {
            this.io.emit('workflow-event', event);
        }

        const listeners = this.listeners.get(event.type);
        if (listeners) {
            listeners.forEach(callback => callback(event));
        }
    }

    on(eventType: string, callback: (event: WorkflowEvent) => void): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(callback);
    }

    off(eventType: string, callback: (event: WorkflowEvent) => void): void {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    emitWorkflowStarted(processId: string, data?: any): void {
        this.emit({
            type: 'workflow.started',
            processId,
            data,
            timestamp: new Date()
        });
    }

    emitTaskCreated(processId: string, taskId: string, data?: any): void {
        this.emit({
            type: 'task.created',
            processId,
            taskId,
            data,
            timestamp: new Date()
        });
    }

    emitTaskCompleted(processId: string, taskId: string, data?: any): void {
        this.emit({
            type: 'task.completed',
            processId,
            taskId,
            data,
            timestamp: new Date()
        });
    }

    emitWorkflowCompleted(processId: string, data?: any): void {
        this.emit({
            type: 'workflow.completed',
            processId,
            data,
            timestamp: new Date()
        });
    }

    emitWorkflowRejected(processId: string, data?: any): void {
        this.emit({
            type: 'workflow.rejected',
            processId,
            data,
            timestamp: new Date()
        });
    }

    emitWorkflowClosed(processId: string, data?: any): void {
        this.emit({
            type: 'workflow.closed',
            processId,
            data,
            timestamp: new Date()
        });
    }
}

export const eventBus = new EventBus();
