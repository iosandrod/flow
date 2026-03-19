import { Element } from 'diagram-js/lib/model/Types'
import { ModdleElement } from 'bpmn-moddle'
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil'
import { createModdleElement, getExtensionElementsList } from '@/utils/BpmnExtensionElementsUtil'
import modelerStore from '@/store/modeler'
import editorStore from '@/store/editor'
import { without } from 'min-dash'

/////// 功能函数
export function getExtensionProperties(element: Element): ModdleElement[] {
  const businessObject = getRelevantBusinessObject(element)

  if (!businessObject) return []
  return getPropertiesList(businessObject) || []
}

export function addExtensionProperty(element: Element, property) {
  try {
    const store = modelerStore()
    const editor = editorStore()

    const moddle = store.getModdle
    const modeling = store.getModeling
    const prefix = editor.getProcessEngine

    const businessObject = getRelevantBusinessObject(element)

    // 判断 extensionElements
    let extensionElements = businessObject.get('extensionElements')
    if (!extensionElements) {
      extensionElements = createModdleElement(
        'bpmn:ExtensionElements',
        { values: [] },
        businessObject
      )
      modeling.updateModdleProperties(element, businessObject, { extensionElements })
    }
    // 判断 extensionElements 是否有 properties
    let properties = getProperties(businessObject)
    if (!properties) {
      properties = createModdleElement(`${prefix}:Properties`, { values: [] }, extensionElements)
      modeling.updateModdleProperties(element, extensionElements, {
        values: [...extensionElements.get('values'), properties]
      })
    }
    // 创建新属性并添加
    const newProperty = createModdleElement(`${prefix}:Property`, property, properties)
    modeling.updateModdleProperties(element, properties, {
      values: [...properties?.get('values'), newProperty]
    })
  } catch (e) {
    console.log(e)
  }
}
export function addTaskDefinition(element: Element, taskDefinitionData) {
  try {
    const store = modelerStore()
    const editor = editorStore()

    const moddle = store.getModdle
    const modeling: any = store.getModeling
    const prefix = editor.getProcessEngine // 应该是 'zeebe'

    const businessObject = getRelevantBusinessObject(element)

    // 只允许 ServiceTask
    if (businessObject.$type !== 'bpmn:ServiceTask') {
      console.warn('TaskDefinition 只能添加到 ServiceTask')
      return
    }

    // 1️⃣ 确保 extensionElements 存在
    let extensionElements = businessObject.get('extensionElements')

    if (!extensionElements) {
      extensionElements = createModdleElement(
        'bpmn:ExtensionElements',
        { values: [] },
        businessObject
      )

      modeling.updateModdleProperties(element, businessObject, {
        extensionElements
      })
    }

    // 2️⃣ 删除旧的 TaskDefinition（保持唯一）
    const existingValues = extensionElements.get('values') || []

    const filteredValues = existingValues.filter(
      (item) => item.$type !== `${prefix}:TaskDefinition`
    )

    // 3️⃣ 创建新的 TaskDefinition
    const newTaskDefinition = createModdleElement(
      `${prefix}:TaskDefinition`,
      {
        type: taskDefinitionData.type,
        retries: String(taskDefinitionData.retries ?? 3)
      },
      extensionElements
    )

    // 4️⃣ 更新 extensionElements
    modeling.updateModdleProperties(element, extensionElements, {
      values: [...filteredValues, newTaskDefinition]
    })
  } catch (e) {
    console.log(e)
  }
}
export function removeExtensionProperty(element: Element, property: ModdleElement) {
  const businessObject = getRelevantBusinessObject(element)
  const extensionElements = businessObject.get('extensionElements')
  const properties = getProperties(businessObject)
  if (!properties) return

  const store = modelerStore()
  const modeling = store.getModeling

  const values = without(properties.get('values'), property as any)
  modeling.updateModdleProperties(element, properties, { values })

  if (!values || !values.length) {
    modeling.updateModdleProperties(element, extensionElements, {
      values: without(extensionElements.get('values'), properties as any)
    })
  }
}

///// helpers
function getRelevantBusinessObject(element: Element) {
  const businessObject = getBusinessObject(element)
  if (is(element, 'bpmn:Participant')) {
    return businessObject.get('processRef')
  }
  return businessObject
}
function getPropertiesList(bo: ModdleElement): [] {
  const properties = getProperties(bo)
  return properties && properties.get('values')
}
function getProperties(bo: ModdleElement): ModdleElement | null {
  return getExtensionElementsList(bo)[0]
}
