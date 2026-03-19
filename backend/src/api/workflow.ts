import { Router, Request, Response } from 'express';
import { StrategyManager } from '../strategy/StrategyManager';
import { WorkflowRequest } from '../types';

export function createWorkflowRouter(strategyManager: StrategyManager): Router {
    const router = Router();

    router.post('/', async (req: Request, res: Response) => {
        try {
            const { action, data } = req.body as WorkflowRequest;
            
            if (!action || !data) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: action, data'
                });
                return;
            }

            let result;
            
            const bpmnActions = ['createBpmn', 'listBpmn', 'getBpmn', 'updateBpmn', 'deleteBpmn'];
            if (bpmnActions.includes(action)) {
                result = await strategyManager.executeBpmnCrud(action, data);
            } else {
                result = await strategyManager.execute(action, data);
            }

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    router.get('/bpmn', async (req: Request, res: Response) => {
        try {
            const result = await strategyManager.executeBpmnCrud('listBpmn', {});
            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    router.get('/bpmn/:key', async (req: Request, res: Response) => {
        try {
            const result = await strategyManager.executeBpmnCrud('getBpmn', { bpmnKey: req.params.key });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    router.get('/tasks', async (req: Request, res: Response) => {
        try {
            const result = await strategyManager.execute('getAllPendingTasks', {});
            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
}
