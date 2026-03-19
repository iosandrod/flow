/**
 * 测试脚本：发起审批并观察Worker触发情况
 * 
 * 运行方式：node testWorkflow.js
 */

const http = require('http');

const API_URL = 'http://localhost:3000';

function postRequest(action, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ action, data });
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/workflow',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function test() {
    console.log('========== 测试开始 ==========\n');
    
    // 1. 先列出流程
    console.log('1. 获取流程列表...');
    const listResult = await postRequest('listBpmn', {});
    console.log('流程列表:', JSON.stringify(listResult, null, 2));
    
    if (listResult.success && listResult.data && listResult.data.length > 0) {
        const bpmnKey = listResult.data[0].id;
        
        // 2. 发起审批
        console.log('\n2. 发起审批...');
        const startResult = await postRequest('start', {
            bpmnKey: bpmnKey,
            starterId: 'manager001',
            businessKey: 'biz_test_' + Date.now(),
            processName: '测试审批',
            variables: {
                amount: 5000,
                applicant: '张三',
                reason: '测试原因'
            }
        });
        console.log('发起结果:', JSON.stringify(startResult, null, 2));
        
        console.log('\n========== 请查看后端控制台 ==========');
        console.log('观察是否有以下日志：');
        console.log('  - [Worker] Received job for xxx');
        console.log('  - [Worker] Created pending task xxx');
        console.log('===================================\n');
        
        // 等待一下让Worker有时间处理
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 3. 查询待办任务
        console.log('\n3. 查询待办任务...');
        const tasksResult = await postRequest('getPendingTasks', {
            userId: 'manager001'
        });
        console.log('待办任务:', JSON.stringify(tasksResult, null, 2));
        
    } else {
        console.log('没有找到流程定义！');
    }
    
    console.log('\n========== 测试完成 ==========');
}

test().catch(console.error);
