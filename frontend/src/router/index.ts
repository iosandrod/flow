import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'

// 懒加载组件
const Layout = () => import('@/views/Layout.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const StartWorkflow = () => import('@/views/StartWorkflow.vue')
const PendingTasks = () => import('@/views/PendingTasks.vue')
const MyApplications = () => import('@/views/MyApplications.vue')
const Designer = () => import('@/components/Designer/index.tsx')
const ApprovalDesigner = () => import('@/views/ApprovalDesigner.vue')

export interface MenuRoute extends RouteRecordRaw {
  meta?: {
    title: string
    icon?: string
    hidden?: boolean
  }
}

const routes: MenuRoute[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '工作台',
          icon: 'home'
        }
      },
      {
        path: 'start',
        name: 'StartWorkflow',
        component: StartWorkflow,
        meta: {
          title: '审批管理',
          icon: 'plus'
        }
      },
      {
        path: 'pending',
        name: 'PendingTasks',
        component: PendingTasks,
        meta: {
          title: '我的待办',
          icon: 'clock'
        }
      },
      {
        path: 'myApply',
        name: 'MyApplications',
        component: MyApplications,
        meta: {
          title: '我的申请',
          icon: 'list'
        }
      },
      {
        path: 'designer',
        name: 'Designer',
        component: Designer,
        meta: {
          title: '流程设计器',
          icon: 'edit'
        }
      },
      {
        path: 'approvalDesigner',
        name: 'ApprovalDesigner',
        component: ApprovalDesigner,
        meta: {
          title: '审批设计器',
          icon: 'edit'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
