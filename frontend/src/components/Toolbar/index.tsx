import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { NButtonGroup, NTooltip, NButton, NIcon, NSpace, NAvatar } from 'naive-ui'
import { ListChecks, FolderOpen, Workflow, Save, FolderDown, FilePlus, User, Play } from 'lucide-vue-next'
import Imports from '@/components/Toolbar/components/Imports'
import Exports from '@/components/Toolbar/components/Exports'
import Previews from '@/components/Toolbar/components/Previews'
import Aligns from '@/components/Toolbar/components/Aligns'
import Scales from '@/components/Toolbar/components/Scales'
import Commands from '@/components/Toolbar/components/Commands'
import ExternalTools from '@/components/Toolbar/components/ExternalTools'
import { PendingTasks, ApprovalList, BpmnManager, UserLogin, StartWorkflow } from '@/components/Workflow'
import LoadSave from '@/components/Workflow/LoadSave.vue'
import modeler from '@/store/modeler'
import { getCurrentUser } from '@/services/workflow'

const DEFAULT_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
    xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
    xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
    xmlns:zeebe="http://camunda.org/schema/zeebe/1.0" id="Definitions_1"
    targetNamespace="http://bpmn.io/schema/bpmn">
    <bpmn:process id="approval-process" name="审批流程" isExecutable="true">
        <bpmn:startEvent id="start" name="开始">
            <bpmn:outgoing>flow_start</bpmn:outgoing>
        </bpmn:startEvent>
        <bpmn:exclusiveGateway id="Gateway_Amount" name="金额判断" default="flow_high">
            <bpmn:incoming>flow_manager</bpmn:incoming>
            <bpmn:outgoing>flow_normal</bpmn:outgoing>
            <bpmn:outgoing>flow_high</bpmn:outgoing>
        </bpmn:exclusiveGateway>
        <bpmn:endEvent id="end" name="结束">
            <bpmn:incoming>flow_finance_low</bpmn:incoming>
            <bpmn:incoming>flow_boss</bpmn:incoming>
        </bpmn:endEvent>
        <bpmn:sequenceFlow id="flow_start" sourceRef="start" targetRef="Task_Manager" />
        <bpmn:sequenceFlow id="flow_manager" sourceRef="Task_Manager" targetRef="Gateway_Amount" />
        <bpmn:sequenceFlow id="flow_normal" sourceRef="Gateway_Amount" targetRef="Task_Finance_Low">
            <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">=amount &lt; 10000</bpmn:conditionExpression>
        </bpmn:sequenceFlow>
        <bpmn:sequenceFlow id="flow_high" sourceRef="Gateway_Amount" targetRef="Task_Boss" />
        <bpmn:sequenceFlow id="flow_finance_low" sourceRef="Task_Finance_Low" targetRef="end" />
        <bpmn:sequenceFlow id="flow_boss" sourceRef="Task_Boss" targetRef="end" />
        <bpmn:serviceTask id="Task_Manager" name="部门经理审批">
            <bpmn:extensionElements>
                <zeebe:taskDefinition type="manager-approval" />
            </bpmn:extensionElements>
            <bpmn:incoming>flow_start</bpmn:incoming>
            <bpmn:outgoing>flow_manager</bpmn:outgoing>
        </bpmn:serviceTask>
        <bpmn:serviceTask id="Task_Boss" name="总经理审批">
            <bpmn:extensionElements>
                <zeebe:taskDefinition type="boss-approval" />
            </bpmn:extensionElements>
            <bpmn:incoming>flow_high</bpmn:incoming>
            <bpmn:outgoing>flow_boss</bpmn:outgoing>
        </bpmn:serviceTask>
        <bpmn:serviceTask id="Task_Finance_Low" name="财务审批(低金额)">
            <bpmn:extensionElements>
                <zeebe:taskDefinition type="finance-approval" />
            </bpmn:extensionElements>
            <bpmn:incoming>flow_normal</bpmn:incoming>
            <bpmn:outgoing>flow_finance_low</bpmn:outgoing>
        </bpmn:serviceTask>
    </bpmn:process>
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="approval-process">
            <bpmndi:BPMNShape id="start_shape" bpmnElement="start">
                <dc:Bounds x="100" y="150" width="36" height="36" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="gateway_shape" bpmnElement="Gateway_Amount" isMarkerVisible="true">
                <dc:Bounds x="360" y="135" width="50" height="50" />
                <bpmndi:BPMNLabel>
                    <dc:Bounds x="420" y="153" width="44" height="14" />
                </bpmndi:BPMNLabel>
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="end_shape" bpmnElement="end">
                <dc:Bounds x="650" y="150" width="36" height="36" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="Activity_1d70pc8_di" bpmnElement="Task_Manager">
                <dc:Bounds x="200" y="110" width="120" height="120" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="Activity_0q5ei0o_di" bpmnElement="Task_Boss">
                <dc:Bounds x="480" y="180" width="120" height="120" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNShape id="Activity_104irvp_di" bpmnElement="Task_Finance_Low">
                <dc:Bounds x="480" y="40" width="120" height="120" />
            </bpmndi:BPMNShape>
            <bpmndi:BPMNEdge id="flow_start_edge" bpmnElement="flow_start">
                <di:waypoint x="136" y="168" />
                <di:waypoint x="200" y="168" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="flow_manager_edge" bpmnElement="flow_manager">
                <di:waypoint x="320" y="142" />
                <di:waypoint x="340" y="142" />
                <di:waypoint x="340" y="164" />
                <di:waypoint x="364" y="164" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="flow_normal_edge" bpmnElement="flow_normal">
                <di:waypoint x="385" y="135" />
                <di:waypoint x="385" y="80" />
                <di:waypoint x="480" y="80" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="flow_high_edge" bpmnElement="flow_high">
                <di:waypoint x="385" y="185" />
                <di:waypoint x="385" y="263" />
                <di:waypoint x="480" y="263" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="flow_finance_low_edge" bpmnElement="flow_finance_low">
                <di:waypoint x="600" y="80" />
                <di:waypoint x="625" y="80" />
                <di:waypoint x="625" y="168" />
                <di:waypoint x="650" y="168" />
            </bpmndi:BPMNEdge>
            <bpmndi:BPMNEdge id="flow_boss_edge" bpmnElement="flow_boss">
                <di:waypoint x="600" y="250" />
                <di:waypoint x="625" y="250" />
                <di:waypoint x="625" y="168" />
                <di:waypoint x="650" y="168" />
            </bpmndi:BPMNEdge>
        </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
</bpmn:definitions>`

const Toolbar = defineComponent({
  name: 'ToolBar',
  props: {
    xml: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:xml'],
  setup(props, { emit }) {
    const pendingTasksRef = ref()
    const approvalListRef = ref()
    const bpmnManagerRef = ref()
    const loadSaveRef = ref()
    const userLoginRef = ref()
    const startWorkflowRef = ref()
    const modelerStore = modeler()

    const currentUser = ref(getCurrentUser())

    const handleXmlChange = (xml: string) => {
      emit('update:xml', xml)
    }

    const loadDefaultBpmn = () => {
      modelerStore.getModeler?.importXML(DEFAULT_BPMN)
    }

    const handleUserChange = () => {
      currentUser.value = getCurrentUser()
    }

    onMounted(() => {
      window.addEventListener('user-changed', handleUserChange)
      setTimeout(() => {
        // loadDefaultBpmn()//
      }, 10);
    })

    onUnmounted(() => {
      window.removeEventListener('user-changed', handleUserChange)
    })

    const userButtonText = computed(() => {
      const user = currentUser.value
      if (user?.UserTrueName) {
        return user.UserTrueName
      }
      if (user?.UserName) {
        return user.UserName
      }
      return '登录'
    })

    return () => (
      <div class="toolbar">
        <NButtonGroup>
          <Imports></Imports>
          <Exports></Exports>
          <Previews></Previews>
        </NButtonGroup>
        <Aligns></Aligns>
        <Scales></Scales>
        <Commands></Commands>
        <ExternalTools></ExternalTools>

        <NButtonGroup>
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" onClick={() => { userLoginRef.value?.open() }}>
                  <NIcon component={User}></NIcon>
                  <span style="margin-left: 4px;">{userButtonText.value}</span>
                </NButton>
              ),
              default: () => '切换用户'
            }}
          </NTooltip>
        </NButtonGroup>

        <NButtonGroup>
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" onClick={loadDefaultBpmn}>
                  <NIcon component={FilePlus}></NIcon>
                  <span style="margin-left: 4px;">默认流程</span>
                </NButton>
              ),
              default: () => '加载默认示例流程'
            }}
          </NTooltip>

          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" onClick={() => loadSaveRef.value?.openSave(props.xml)}>
                  <NIcon component={Save}></NIcon>
                  <span style="margin-left: 4px;">保存流程</span>
                </NButton>
              ),
              default: () => '保存当前流程到服务器'
            }}
          </NTooltip>

          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" onClick={() => loadSaveRef.value?.openLoad()}>
                  <NIcon component={FolderDown}></NIcon>
                  <span style="margin-left: 4px;">加载流程</span>
                </NButton>
              ),
              default: () => '从服务器加载流程'
            }}
          </NTooltip>
        </NButtonGroup>

        <NButtonGroup>
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" onClick={() => pendingTasksRef.value?.open()}>
                  <NIcon component={ListChecks}></NIcon>
                  <span style="margin-left: 4px;">待办任务</span>
                </NButton>
              ),
              default: () => '查看待审批任务'
            }}
          </NTooltip>

          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" onClick={() => approvalListRef.value?.open()}>
                  <NIcon component={FolderOpen}></NIcon>
                  <span style="margin-left: 4px;">审批列表</span>
                </NButton>
              ),
              default: () => '查看所有审批记录'
            }}
          </NTooltip>

          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" type="primary" onClick={() => bpmnManagerRef.value?.open()}>
                  <NIcon component={Workflow}></NIcon>
                  <span style="margin-left: 4px;">流程管理</span>
                </NButton>
              ),
              default: () => '管理BPMN流程定义'
            }}
          </NTooltip>

          <NTooltip>
            {{
              trigger: () => (
                <NButton size="small" type="success" onClick={() => startWorkflowRef.value?.open()}>
                  <NIcon component={Play}></NIcon>
                  <span style="margin-left: 4px;">发起审批</span>
                </NButton>
              ),
              default: () => '发起新的审批流程'
            }}
          </NTooltip>
        </NButtonGroup>

        <PendingTasks ref={pendingTasksRef}></PendingTasks>
        <ApprovalList ref={approvalListRef}></ApprovalList>
        <BpmnManager ref={bpmnManagerRef}></BpmnManager>
        <LoadSave ref={loadSaveRef}></LoadSave>
        <UserLogin ref={userLoginRef}></UserLogin>
        <StartWorkflow ref={startWorkflowRef}></StartWorkflow>
      </div>
    )
  }
})

export default Toolbar
