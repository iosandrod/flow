import { Router, Request, Response } from 'express';
import { DbAdapt } from '../db/DbAdapt';

export function createUserRouter(dbAdapt: DbAdapt): Router {
    const router = Router();

    router.get('/list', async (req: Request, res: Response) => {
        try {
            const users = await dbAdapt.getAllUsers();
            const formattedUsers = users.map(user => ({
                User_Id: user.User_Id,
                UserName: user.UserName,
                UserTrueName: user.UserTrueName,
                RoleName: user.RoleName,
                DeptName: user.DeptName,
                Enable: user.Enable
            }));
            res.json({
                success: true,
                data: formattedUsers
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
}
